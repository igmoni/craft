#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import pc from "picocolors";

import type { FrameworkType } from "../../dist/core/types/framework.js";
import {
  defaultFrameworkTargets,
  extendedIntegrationTargets,
} from "./expectations/frameworks.ts";
import {
  assertDirectoriesExist,
  assertFilesExist,
  assertPackageJson,
} from "./helpers/assertions.ts";
import { executeBuild } from "./helpers/build.ts";
import { runProjectGeneration } from "./helpers/generation.ts";
import {
  verifyEslintIntegration,
  verifyGitIntegration,
  verifyHuskyCommitlintIntegration,
  verifyPrettierIntegration,
  verifyPrismaIntegration,
  verifyShadcnIntegration,
  verifyTailwindIntegration,
} from "./helpers/integrations.ts";
import {
  printBanner,
  printSubstep,
  printSummaryTable,
  printTargetStart,
} from "./helpers/reporter.ts";
import {
  cleanupTempWorkspace,
  createTempWorkspace,
} from "./helpers/temp-dir.ts";
import type {
  CheckResult,
  FrameworkTestResult,
  FrameworkTestTarget,
  RunnerCliOptions,
  TestSuiteSummary,
} from "./types.ts";

function parseCliArgs(): RunnerCliOptions {
  const args = process.argv.slice(2);
  const options: RunnerCliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printBanner();
      console.log(`Usage: npm run test:generators [options]

Options:
  -f, --framework <names>     Comma-separated framework list to test (e.g. express,react)
  --with-integrations         Run additional integration test targets (Prisma, shadcn, etc.)
  --skip-build                Skip build execution step (faster structure & integration verification)
  --keep-temp                 Do not delete temporary test directories (useful for debugging)
  -v, --verbose               Display verbose logs
  -h, --help                  Display this help message

Supported frameworks:
  vue, angular, react, nestjs, express, fastify, hono, next
`);
      process.exit(0);
    }

    if (arg === "--framework" || arg === "-f") {
      const nextArg = args[++i];
      if (nextArg) {
        options.frameworks = nextArg
          .split(",")
          .map((f) => f.trim().toLowerCase()) as FrameworkType[];
      }
    } else if (arg.startsWith("--framework=")) {
      options.frameworks = arg
        .slice("--framework=".length)
        .split(",")
        .map((f) => f.trim().toLowerCase()) as FrameworkType[];
    } else if (arg === "--with-integrations") {
      options.withIntegrations = true;
    } else if (arg === "--skip-build") {
      options.skipBuild = true;
    } else if (arg === "--keep-temp") {
      options.keepTemp = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    }
  }

  return options;
}

async function runTarget(
  target: FrameworkTestTarget,
  index: number,
  total: number,
  options: RunnerCliOptions
): Promise<FrameworkTestResult> {
  const targetStartTime = Date.now();
  printTargetStart(index, total, `${target.name} (${target.framework})`);

  let tempWorkspace: string | undefined;
  const integrationResults: Record<string, CheckResult> = {};
  const logs: string[] = [];

  let generationCheck: CheckResult = {
    name: "Project Generation",
    status: "failed",
    message: "Not started",
  };

  let directoryCheck: CheckResult = {
    name: "Directory Structure",
    status: "failed",
    message: "Not started",
  };

  let buildCheck: CheckResult = {
    name: "Build Verification",
    status: "skipped",
    message: "Not executed",
  };

  let overallPassed = false;
  let failureReason: string | undefined;

  try {
    // Step 1: Create isolated temporary directory
    tempWorkspace = await createTempWorkspace(
      `craft-test-${target.framework}-`
    );

    // Step 2: Run generation pipeline
    const genResult = await runProjectGeneration(target.config, tempWorkspace);

    if (genResult.error) {
      generationCheck = {
        name: "Project Generation",
        status: "failed",
        message: genResult.error.message,
        durationMs: genResult.durationMs,
      };
      printSubstep(generationCheck);
      failureReason = `Generation error: ${genResult.error.message}`;
      return {
        targetId: target.id,
        framework: target.framework,
        title: target.name,
        generation: generationCheck,
        directoryValidation: directoryCheck,
        integrationValidation: integrationResults,
        buildValidation: buildCheck,
        overallStatus: "failed",
        failureReason,
        durationMs: Date.now() - targetStartTime,
        logs,
      };
    }

    generationCheck = {
      name: "Project Generation",
      status: "passed",
      message: `Scaffolded successfully into ${path.basename(genResult.projectDir)}`,
      durationMs: genResult.durationMs,
    };
    printSubstep(generationCheck);

    const projectDir = genResult.projectDir;

    // Step 3: Verify structure, files, and package.json
    const fileResult = await assertFilesExist(
      projectDir,
      target.expectations.files
    );
    const dirResult = target.expectations.directories
      ? await assertDirectoriesExist(
          projectDir,
          target.expectations.directories
        )
      : { name: "Directory Structure", status: "passed" as const };
    const pkgResult = await assertPackageJson(
      projectDir,
      target.expectations.packageJson
    );

    if (fileResult.status === "failed") {
      directoryCheck = fileResult;
      failureReason = fileResult.message;
    } else if (dirResult.status === "failed") {
      directoryCheck = dirResult;
      failureReason = dirResult.message;
    } else if (pkgResult.status === "failed") {
      directoryCheck = pkgResult;
      failureReason = pkgResult.message;
    } else {
      directoryCheck = {
        name: "Directory Structure & Files",
        status: "passed",
        message:
          "All expected framework files and package.json entries verified",
      };
    }
    printSubstep(directoryCheck);

    // Step 4: Verify configured integrations
    const expInteg = target.expectations.integrations;

    // Prisma
    integrationResults["prisma"] = await verifyPrismaIntegration(
      projectDir,
      expInteg.prisma ?? false
    );
    printSubstep(integrationResults["prisma"]);

    // Tailwind
    integrationResults["tailwind"] = await verifyTailwindIntegration(
      projectDir,
      target.framework,
      expInteg.tailwind ?? false
    );
    printSubstep(integrationResults["tailwind"]);

    // shadcn/ui
    integrationResults["shadcn"] = await verifyShadcnIntegration(
      projectDir,
      expInteg.shadcn ?? false
    );
    printSubstep(integrationResults["shadcn"]);

    // ESLint
    integrationResults["eslint"] = await verifyEslintIntegration(
      projectDir,
      expInteg.eslint ?? false
    );
    printSubstep(integrationResults["eslint"]);

    // Prettier
    integrationResults["prettier"] = await verifyPrettierIntegration(
      projectDir,
      expInteg.prettier ?? false
    );
    printSubstep(integrationResults["prettier"]);

    // Husky & Commitlint
    integrationResults["husky"] = await verifyHuskyCommitlintIntegration(
      projectDir,
      expInteg.husky ?? false,
      expInteg.commitlint ?? false
    );
    printSubstep(integrationResults["husky"]);

    // Git
    integrationResults["git"] = await verifyGitIntegration(
      projectDir,
      expInteg.git ?? false
    );
    printSubstep(integrationResults["git"]);

    const anyIntegrationFailed = Object.values(integrationResults).find(
      (r) => r.status === "failed"
    );
    if (anyIntegrationFailed && !failureReason) {
      failureReason = `Integration failure: ${anyIntegrationFailed.message}`;
    }

    // Step 5: Execute build / typecheck
    if (options.skipBuild) {
      buildCheck = {
        name: "Build Verification",
        status: "skipped",
        message: "Skipped via --skip-build flag",
      };
    } else {
      buildCheck = await executeBuild(projectDir, target.expectations.build);
    }
    printSubstep(buildCheck);

    if (buildCheck.status === "failed" && !failureReason) {
      failureReason = `Build failed: ${buildCheck.message}`;
    }

    // Determine overall pass/fail status
    overallPassed =
      generationCheck.status === "passed" &&
      directoryCheck.status === "passed" &&
      !anyIntegrationFailed &&
      buildCheck.status !== "failed";
  } catch (unexpectedError: unknown) {
    const message =
      unexpectedError instanceof Error
        ? unexpectedError.message
        : String(unexpectedError);
    failureReason = `Unexpected runner error: ${message}`;
    console.error(pc.red(`  ✖ Unexpected error: ${message}`));
    overallPassed = false;
  } finally {
    // Step 6: Clean up temporary directories
    if (tempWorkspace) {
      if (options.keepTemp) {
        console.log(
          pc.yellow(`  [Debug] Preserved test workspace: ${tempWorkspace}`)
        );
      } else {
        await cleanupTempWorkspace(tempWorkspace);
      }
    }
  }

  return {
    targetId: target.id,
    framework: target.framework,
    title: target.name,
    generation: generationCheck,
    directoryValidation: directoryCheck,
    integrationValidation: integrationResults,
    buildValidation: buildCheck,
    overallStatus: overallPassed ? "passed" : "failed",
    failureReason,
    durationMs: Date.now() - targetStartTime,
    logs,
  };
}

export async function runGeneratorTests(): Promise<number> {
  const cliOptions = parseCliArgs();
  printBanner();

  let targetsToRun = [...defaultFrameworkTargets];

  if (cliOptions.withIntegrations) {
    targetsToRun.push(...extendedIntegrationTargets);
  }

  if (cliOptions.frameworks && cliOptions.frameworks.length > 0) {
    const selected = new Set(cliOptions.frameworks);
    targetsToRun = targetsToRun.filter((t) => selected.has(t.framework));

    if (targetsToRun.length === 0) {
      console.error(
        pc.red(
          `No frameworks matched the filter: "${cliOptions.frameworks.join(", ")}".`
        )
      );
      console.log(
        pc.dim(
          `Available frameworks: ${defaultFrameworkTargets.map((t) => t.framework).join(", ")}`
        )
      );
      return 1;
    }
  }

  console.log(
    `Running integration tests for ${pc.cyan(targetsToRun.length.toString())} target(s)...\n`
  );

  const suiteStartTime = Date.now();
  const results: FrameworkTestResult[] = [];

  for (let i = 0; i < targetsToRun.length; i++) {
    const target = targetsToRun[i];
    const result = await runTarget(target, i, targetsToRun.length, cliOptions);
    results.push(result);
  }

  const passedCount = results.filter(
    (r) => r.overallStatus === "passed"
  ).length;
  const failedCount = results.filter(
    (r) => r.overallStatus === "failed"
  ).length;

  const summary: TestSuiteSummary = {
    results,
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    skipped: 0,
    durationMs: Date.now() - suiteStartTime,
  };

  printSummaryTable(summary);

  return failedCount > 0 ? 1 : 0;
}

// Execute when run directly
runGeneratorTests()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((err) => {
    console.error(pc.red(`\nFatal error in generator test runner:`), err);
    process.exit(1);
  });
