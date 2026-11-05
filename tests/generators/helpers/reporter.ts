import pc from "picocolors";

import type {
  CheckResult,
  FrameworkTestResult,
  TestSuiteSummary,
} from "../types.ts";

export function formatStatus(status: "passed" | "failed" | "skipped"): string {
  switch (status) {
    case "passed":
      return pc.green("✔ PASS");
    case "failed":
      return pc.red("✖ FAIL");
    case "skipped":
      return pc.yellow("○ SKIP");
  }
}

export function printBanner(): void {
  console.log(
    pc.cyan("\n============================================================")
  );
  console.log(
    pc.bold(
      pc.cyan("       Craft Automated Generator Integration Test Runner    ")
    )
  );
  console.log(
    pc.cyan("============================================================\n")
  );
}

export function printTargetStart(
  index: number,
  total: number,
  name: string
): void {
  console.log(
    pc.bold(
      `\n[${pc.cyan(`${index + 1}/${total}`)}] Testing Framework: ${pc.blue(name)}`
    )
  );
}

export function printSubstep(result: CheckResult): void {
  const symbol =
    result.status === "passed"
      ? pc.green("  ✔")
      : result.status === "failed"
        ? pc.red("  ✖")
        : pc.yellow("  ○");

  const duration =
    result.durationMs !== undefined
      ? pc.dim(` (${(result.durationMs / 1000).toFixed(1)}s)`)
      : "";

  const detail = result.message ? pc.dim(` - ${result.message}`) : "";

  console.log(`${symbol} ${pc.bold(result.name)}${duration}${detail}`);
}

export function printSummaryTable(summary: TestSuiteSummary): void {
  console.log(
    pc.cyan("\n------------------------------------------------------------")
  );
  console.log(
    pc.bold(
      pc.white("                  GENERATOR TEST SUMMARY                   ")
    )
  );
  console.log(
    pc.cyan("------------------------------------------------------------")
  );

  // Column headers
  const colFw = "Framework".padEnd(16);
  const colGen = "Generation".padEnd(14);
  const colDir = "Structure".padEnd(14);
  const colInteg = "Integrations".padEnd(16);
  const colBuild = "Build".padEnd(14);
  const colStatus = "Status";

  console.log(
    pc.bold(`\n${colFw}${colGen}${colDir}${colInteg}${colBuild}${colStatus}`)
  );
  console.log(pc.dim("-".repeat(84)));

  let totalIntegrationPassed = 0;
  let totalIntegrationFailed = 0;
  let totalIntegrationSkipped = 0;

  for (const res of summary.results) {
    const fw = res.title.padEnd(16);
    const gen = formatStatus(res.generation.status).padEnd(23); // padding accounts for ANSI codes
    const dir = formatStatus(res.directoryValidation.status).padEnd(23);

    // Summarize integration results
    const integValues = Object.values(res.integrationValidation);
    let integSummary = "N/A";

    const passed = integValues.filter((v) => v.status === "passed").length;
    const failed = integValues.filter((v) => v.status === "failed").length;
    const skipped = integValues.filter((v) => v.status === "skipped").length;

    totalIntegrationPassed += passed;
    totalIntegrationFailed += failed;
    totalIntegrationSkipped += skipped;

    if (failed > 0) {
      integSummary = pc.red(`✖ ${failed} failed`);
    } else if (passed > 0) {
      integSummary = pc.green(`✔ ${passed} passed`);
    } else {
      integSummary = pc.yellow("○ skipped");
    }

    const integFormatted = integSummary.padEnd(25);
    const build = formatStatus(res.buildValidation.status).padEnd(23);
    const overall =
      res.overallStatus === "passed"
        ? pc.bold(pc.green("PASSED"))
        : pc.bold(pc.red("FAILED"));

    console.log(`${fw}${gen}${dir}${integFormatted}${build}${overall}`);
  }

  console.log(pc.dim("-".repeat(84)));

  // Failures section
  const failedResults = summary.results.filter(
    (r) => r.overallStatus === "failed"
  );
  if (failedResults.length > 0) {
    console.log(pc.red(pc.bold("\nFAILURES & DIAGNOSTICS:")));

    for (const fail of failedResults) {
      console.log(pc.red(`\n● ${fail.title} (${fail.framework}):`));
      if (fail.failureReason) {
        console.log(`  ${pc.bold("Reason:")} ${fail.failureReason}`);
      }

      if (fail.generation.status === "failed" && fail.generation.message) {
        console.log(
          `  ${pc.bold("Generation Error:")} ${fail.generation.message}`
        );
      }

      if (
        fail.directoryValidation.status === "failed" &&
        fail.directoryValidation.message
      ) {
        console.log(
          `  ${pc.bold("Directory / File Error:")} ${fail.directoryValidation.message}`
        );
      }

      for (const [name, check] of Object.entries(fail.integrationValidation)) {
        if (check.status === "failed") {
          console.log(
            `  ${pc.bold(`Integration (${name}) Error:`)} ${check.message}`
          );
        }
      }

      if (
        fail.buildValidation.status === "failed" &&
        fail.buildValidation.message
      ) {
        console.log(
          `  ${pc.bold("Build Error:")}\n${fail.buildValidation.message}`
        );
      }
    }
  }

  // Totals
  console.log(
    pc.cyan("\n============================================================")
  );
  console.log(
    `${pc.bold("Total Frameworks Tested:")} ${summary.total} | ` +
      `${pc.bold(pc.green("Passed:"))} ${summary.passed} | ` +
      `${pc.bold(pc.red("Failed:"))} ${summary.failed} | ` +
      `${pc.bold(pc.yellow("Skipped:"))} ${summary.skipped}`
  );
  console.log(
    pc.dim(
      `Integration Checks: ${totalIntegrationPassed + totalIntegrationFailed + totalIntegrationSkipped} ` +
        `(${totalIntegrationPassed} passed, ${totalIntegrationFailed} failed, ${totalIntegrationSkipped} skipped) | ` +
        `Total Duration: ${(summary.durationMs / 1000).toFixed(1)}s`
    )
  );
  console.log(
    pc.cyan("============================================================\n")
  );
}
