import fs from "node:fs/promises";
import path from "node:path";

import { getFramework, isFrameworkSupported } from "../registry/framework.js";
import type {
  GeneratorOptions,
  PartialProjectConfig,
} from "../types/config.js";
import type { FrameworkType } from "../types/framework.js";

export function validateProjectName(value: string): true | string {
  const name = value.trim();

  if (!name) {
    return "Project name is required.";
  }

  if (name === ".") {
    return true;
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return "Project name can only contain letters, numbers, hyphens, dots, and underscores.";
  }

  if (name.startsWith("-") || name.startsWith(".")) {
    if (name !== ".") {
      return "Project name cannot start with a hyphen or dot.";
    }
  }

  return true;
}

export function normalizeProjectName(value: string): string {
  const name = value.trim();
  return name === "." ? "." : name;
}

export interface TargetDirectoryInfo {
  targetDir: string;
  actualProjectName: string;
  isCurrentDirectory: boolean;
  exists: boolean;
  isEmpty: boolean;
}

export async function validateTargetDirectory(
  projectName: string
): Promise<TargetDirectoryInfo> {
  const isCurrentDirectory = projectName === ".";
  const targetDir = path.resolve(projectName);
  const actualProjectName = path.basename(targetDir);

  if (!actualProjectName || targetDir === path.parse(targetDir).root) {
    throw new Error(
      "The filesystem root cannot be used as a project directory."
    );
  }

  let exists = false;
  let isEmpty = true;

  try {
    const stat = await fs.lstat(targetDir);
    exists = true;

    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`Target path is not a safe directory: ${targetDir}`);
    }

    const entries = await fs.readdir(targetDir);
    isEmpty = entries.length === 0;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "ENOENT"
    ) {
      exists = false;
      isEmpty = true;
    } else {
      throw error;
    }
  }

  if (exists && !isCurrentDirectory && !isEmpty) {
    throw new Error(
      `Directory "${actualProjectName}" already exists and is not empty. Please choose a different name or use an empty directory.`
    );
  }

  return {
    targetDir,
    actualProjectName,
    isCurrentDirectory,
    exists,
    isEmpty,
  };
}

export function validateExistingConfig(
  config: PartialProjectConfig,
  framework: FrameworkType
): void {
  if (!isFrameworkSupported(framework)) {
    throw new Error(`Unknown framework: "${framework}"`);
  }

  const frameworkInfo = getFramework(framework);
  const capabilities = frameworkInfo.capabilities;

  if (config.typeScript === true && !capabilities.typescript) {
    throw new Error(`${frameworkInfo.name} does not support TypeScript.`);
  }

  if (config.typeScript === false && !capabilities.javascript) {
    throw new Error(
      `${frameworkInfo.name} does not support JavaScript. Only TypeScript is supported.`
    );
  }

  if (
    config.database !== undefined &&
    config.database !== "none" &&
    !capabilities.database
  ) {
    throw new Error(
      `${frameworkInfo.name} is a frontend framework and does not support Craft database integration.`
    );
  }

  if (config.auth && !capabilities.authProviders.includes(config.auth)) {
    const supported =
      capabilities.authProviders.length > 0
        ? capabilities.authProviders.join(", ")
        : "none";
    throw new Error(
      `${config.auth} authentication is not supported for ${frameworkInfo.name}. (Supported: ${supported})`
    );
  }

  if (config.uiLibrary === "shadcn" && !capabilities.shadcn) {
    throw new Error(
      `shadcn/ui is not supported for ${frameworkInfo.name}. Only React (Vite) and Next.js are supported.`
    );
  }
}

export function validateConfig(config: GeneratorOptions): void {
  const projectNameValidation = validateProjectName(config.projectName);
  if (projectNameValidation !== true) {
    throw new Error(projectNameValidation);
  }

  if (!isFrameworkSupported(config.framework)) {
    throw new Error(`Unsupported framework: "${config.framework}"`);
  }

  const framework = getFramework(config.framework);
  const capabilities = framework.capabilities;

  if (config.typeScript && !capabilities.typescript) {
    throw new Error(
      `${framework.name} does not support TypeScript scaffolding.`
    );
  }

  if (!config.typeScript && !capabilities.javascript) {
    throw new Error(
      `${framework.name} does not support JavaScript scaffolding.`
    );
  }

  if (config.database !== "none" && !capabilities.database) {
    throw new Error(
      `${framework.name} does not support Craft database integration.`
    );
  }

  if (config.auth && !capabilities.authProviders.includes(config.auth)) {
    throw new Error(
      `${config.auth} authentication is not supported for ${framework.name}.`
    );
  }

  if (config.uiLibrary === "shadcn" && !capabilities.shadcn) {
    throw new Error(`shadcn/ui is not supported for ${framework.name}.`);
  }

  const supportedPackageManagers = ["npm", "pnpm", "yarn", "bun"];
  if (!supportedPackageManagers.includes(config.packageManager)) {
    throw new Error(
      `Unsupported package manager: "${config.packageManager}". Supported: ${supportedPackageManagers.join(", ")}`
    );
  }
}
