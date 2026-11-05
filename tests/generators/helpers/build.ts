import { execa } from "execa";
import fs from "node:fs/promises";
import path from "node:path";

import type { CheckResult, FrameworkBuildExpectations } from "../types.ts";

interface PackageJson {
  scripts?: Record<string, string>;
}

function truncateOutput(output: string, maxLines = 15): string {
  const lines = output
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean);

  if (lines.length <= maxLines) {
    return lines.join("\n");
  }

  const tail = lines.slice(-maxLines);
  return `... (${lines.length - maxLines} lines omitted)\n${tail.join("\n")}`;
}

/**
 * Executes the project's build or typecheck command and verifies clean termination.
 */
export async function executeBuild(
  projectDir: string,
  expectations: FrameworkBuildExpectations = {}
): Promise<CheckResult> {
  const startTime = Date.now();

  if (expectations.skip) {
    return {
      name: "Build Verification",
      status: "skipped",
      message:
        expectations.reason || "Build verification intentionally skipped",
      durationMs: 0,
    };
  }

  const pkgPath = path.join(projectDir, "package.json");
  let availableScripts: Record<string, string> = {};

  try {
    const content = await fs.readFile(pkgPath, "utf8");
    const pkg: PackageJson = JSON.parse(content);
    availableScripts = pkg.scripts || {};
  } catch {
    // If package.json cannot be read, fall back to provided command
  }

  // Determine build command from framework expectations
  const command = expectations.command || "npm";
  const args = expectations.args || ["run", "build"];

  // Verify that required script exists before executing it
  if (args[0] === "run" && args[1]) {
    const targetScript = args[1];
    if (!availableScripts[targetScript]) {
      const scriptList = Object.keys(availableScripts).join(", ") || "none";
      return {
        name: "Build Verification",
        status: "failed",
        message: `Required build script "${targetScript}" does not exist in package.json. Available scripts: ${scriptList}`,
        durationMs: Date.now() - startTime,
      };
    }
  }

  const timeoutMs = expectations.timeoutMs || 180_000; // 3 minute build timeout

  // Execute pre-build commands if required (e.g. prisma generate before tsc)
  if (
    expectations.preBuildCommands &&
    expectations.preBuildCommands.length > 0
  ) {
    for (const preCmd of expectations.preBuildCommands) {
      try {
        const preResult = await execa(preCmd.command, preCmd.args, {
          cwd: projectDir,
          windowsHide: true,
          shell: process.platform === "win32",
          timeout: timeoutMs,
          reject: false,
          all: true,
        });

        if (preResult.exitCode !== 0) {
          const output =
            preResult.all || preResult.stderr || preResult.stdout || "";
          return {
            name: "Build Verification",
            status: "failed",
            message: `Pre-build command "${preCmd.command} ${preCmd.args.join(" ")}" failed with code ${preResult.exitCode}.\nOutput:\n${truncateOutput(output)}`,
            durationMs: Date.now() - startTime,
          };
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          name: "Build Verification",
          status: "failed",
          message: `Pre-build step failed (${preCmd.command} ${preCmd.args.join(" ")}): ${message}`,
          durationMs: Date.now() - startTime,
        };
      }
    }
  }

  try {
    const result = await execa(command, args, {
      cwd: projectDir,
      windowsHide: true,
      shell: process.platform === "win32",
      timeout: timeoutMs,
      reject: false,
      all: true,
    });

    const durationMs = Date.now() - startTime;

    if (result.exitCode !== 0) {
      const output =
        result.all ||
        result.stderr ||
        result.stdout ||
        "Command failed with no output";
      const diagnostic = truncateOutput(output);

      return {
        name: "Build Verification",
        status: "failed",
        message: `Command "${command} ${args.join(" ")}" exited with code ${result.exitCode}.\nOutput:\n${diagnostic}`,
        durationMs,
      };
    }

    return {
      name: "Build Verification",
      status: "passed",
      message: `Built cleanly with "${command} ${args.join(" ")}" (${(durationMs / 1000).toFixed(1)}s)`,
      durationMs,
    };
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    return {
      name: "Build Verification",
      status: "failed",
      message: `Failed to execute build (${command} ${args.join(" ")}): ${message}`,
      durationMs,
    };
  }
}
