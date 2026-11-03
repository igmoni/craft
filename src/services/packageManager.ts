import { execa } from "execa";

import type { PackageManager } from "../core/types/config.js";

export interface PackageExecutionCommand {
  command: string;
  args: string[];
}

export async function isPackageManagerInstalled(
  pm: PackageManager
): Promise<boolean> {
  try {
    await execa(pm, ["--version"], {
      stdio: "ignore",
      windowsHide: true,
      shell: process.platform === "win32",
      reject: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function ensurePackageManagerInstalled(
  pm: PackageManager
): Promise<void> {
  const installed = await isPackageManagerInstalled(pm);
  if (!installed) {
    throw new Error(
      `Package manager "${pm}" is not installed or not found in PATH.\n` +
        `Please install ${pm} first or choose an installed package manager (e.g. npm).`
    );
  }
}

export function getInstallCommand(pm: PackageManager): PackageExecutionCommand {
  switch (pm) {
    case "pnpm":
      return { command: "pnpm", args: ["install"] };
    case "yarn":
      return { command: "yarn", args: ["install"] };
    case "bun":
      return { command: "bun", args: ["install"] };
    case "npm":
    default:
      return { command: "npm", args: ["install"] };
  }
}

export function getRunScriptCommand(
  pm: PackageManager,
  script: string,
  args: string[] = []
): string {
  const forwarded =
    args.length === 0 ? "" : ` ${pm === "npm" ? "-- " : ""}${args.join(" ")}`;
  return `${pm} run ${script}${forwarded}`;
}

export function getDlxCommand(
  pm: PackageManager,
  pkg: string,
  args: string[] = []
): PackageExecutionCommand {
  switch (pm) {
    case "pnpm":
      return {
        command: "pnpm",
        args: ["dlx", pkg, ...args],
      };
    case "yarn":
      return {
        command: "yarn",
        args: ["dlx", pkg, ...args],
      };
    case "bun":
      return {
        command: "bunx",
        args: [pkg, ...args],
      };
    case "npm":
    default:
      return {
        command: "npx",
        args: ["--yes", pkg, ...args],
      };
  }
}

export function getCreateCommand(
  pm: PackageManager,
  templatePkg: string,
  targetDirName: string,
  extraArgs: string[] = []
): PackageExecutionCommand {
  switch (pm) {
    case "pnpm":
      return {
        command: "pnpm",
        args: ["create", templatePkg, targetDirName, ...extraArgs],
      };
    case "yarn":
      return {
        command: "yarn",
        args: ["create", templatePkg, targetDirName, ...extraArgs],
      };
    case "bun":
      return {
        command: "bun",
        args: ["create", templatePkg, targetDirName, ...extraArgs],
      };
    case "npm":
    default: {
      const npmArgs = ["create", templatePkg, targetDirName];
      if (extraArgs.length > 0) {
        npmArgs.push("--", ...extraArgs);
      }
      return {
        command: "npm",
        args: npmArgs,
      };
    }
  }
}
