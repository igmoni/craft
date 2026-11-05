import fs from "node:fs/promises";
import path from "node:path";

import { pathExists } from "../../../dist/utils/error.js";
import type { CheckResult, FrameworkPackageExpectations } from "../types.ts";

/**
 * Asserts that all expected files exist inside the project directory.
 */
export async function assertFilesExist(
  projectDir: string,
  relativePaths: string[]
): Promise<CheckResult> {
  const missingFiles: string[] = [];

  for (const relPath of relativePaths) {
    const fullPath = path.join(projectDir, relPath);
    const exists = await pathExists(fullPath);
    if (!exists) {
      missingFiles.push(relPath);
    }
  }

  if (missingFiles.length > 0) {
    return {
      name: "File Existence",
      status: "failed",
      message: `Missing expected files: ${missingFiles.join(", ")}`,
    };
  }

  return {
    name: "File Existence",
    status: "passed",
    message: `All ${relativePaths.length} expected files exist`,
  };
}

/**
 * Asserts that all expected directories exist inside the project directory.
 */
export async function assertDirectoriesExist(
  projectDir: string,
  relativeDirs: string[]
): Promise<CheckResult> {
  const missingDirs: string[] = [];

  for (const relDir of relativeDirs) {
    const fullPath = path.join(projectDir, relDir);
    try {
      const stat = await fs.lstat(fullPath);
      if (!stat.isDirectory()) {
        missingDirs.push(`${relDir} (not a directory)`);
      }
    } catch {
      missingDirs.push(relDir);
    }
  }

  if (missingDirs.length > 0) {
    return {
      name: "Directory Structure",
      status: "failed",
      message: `Missing expected directories: ${missingDirs.join(", ")}`,
    };
  }

  return {
    name: "Directory Structure",
    status: "passed",
    message: `All ${relativeDirs.length} expected directories exist`,
  };
}

/**
 * Asserts validity and expectations for package.json.
 */
export async function assertPackageJson(
  projectDir: string,
  expectations: FrameworkPackageExpectations
): Promise<CheckResult> {
  const pkgPath = path.join(projectDir, "package.json");

  if (!(await pathExists(pkgPath))) {
    return {
      name: "package.json Verification",
      status: "failed",
      message: "package.json does not exist",
    };
  }

  let pkg: Record<string, any>;
  try {
    const content = await fs.readFile(pkgPath, "utf8");
    pkg = JSON.parse(content);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: "package.json Verification",
      status: "failed",
      message: `package.json is not valid JSON: ${message}`,
    };
  }

  const failures: string[] = [];

  // Check required dependencies
  if (expectations.requiredDependencies) {
    const deps = pkg.dependencies || {};
    for (const reqDep of expectations.requiredDependencies) {
      if (!deps[reqDep]) {
        failures.push(`Missing dependency: ${reqDep}`);
      }
    }
  }

  // Check required devDependencies
  if (expectations.requiredDevDependencies) {
    const devDeps = pkg.devDependencies || {};
    for (const reqDev of expectations.requiredDevDependencies) {
      if (!devDeps[reqDev]) {
        failures.push(`Missing devDependency: ${reqDev}`);
      }
    }
  }

  // Check required scripts
  if (expectations.requiredScripts) {
    const scripts = pkg.scripts || {};
    for (const reqScript of expectations.requiredScripts) {
      if (!scripts[reqScript]) {
        failures.push(`Missing script: "${reqScript}"`);
      }
    }
  }

  // Custom field validations
  if (expectations.validateFields) {
    const customResult = expectations.validateFields(pkg);
    if (customResult !== true) {
      failures.push(customResult);
    }
  }

  if (failures.length > 0) {
    return {
      name: "package.json Verification",
      status: "failed",
      message: failures.join("; "),
    };
  }

  return {
    name: "package.json Verification",
    status: "passed",
    message: "package.json is valid with all expected dependencies and scripts",
  };
}
