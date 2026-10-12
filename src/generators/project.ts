import { confirm } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";

import { runCommand } from "../services/runCommand.js";
import {
  createStagingDirectory,
  mergeStagedFiles,
} from "../services/staging.js";
import type { GenerateProjectConfig } from "../types/utils.js";
import { pathExists } from "../utils/common.js";
import { configureAuth } from "./auth.js";
import { configureDatabase } from "./database.js";
import { generateEnvFile } from "./env.js";
import { generateExpressProject } from "./frameworks/express.js";
import { generateNextProject } from "./frameworks/next.js";
import { generateViteProject } from "./frameworks/vite.js";
import { configureTailwind } from "./tailwind.js";
import { configureTools } from "./tools.js";

export const generateProject = async (
  config: GenerateProjectConfig
): Promise<void> => {
  const { projectName, framework } = config;

  const isCurrentDirectory = projectName === ".";
  const targetDir = path.resolve(projectName);
  const actualProjectName = path.basename(targetDir);

  console.log("Preparing project generation...");

  const targetExists = await pathExists(targetDir);

  if (targetExists && !isCurrentDirectory) {
    throw new Error(`Project "${projectName}" already exists.`);
  }

  if (targetExists) {
    const stat = await fs.lstat(targetDir);

    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`Target is not a safe directory: ${targetDir}`);
    }
  }

  const entries = targetExists ? await fs.readdir(targetDir) : [];

  if (isCurrentDirectory && entries.length > 0) {
    const shouldContinue = await confirm({
      message:
        "This directory contains existing files. Continue without overwriting them?",
      default: false,
    });

    if (!shouldContinue) {
      console.log("Project generation cancelled.");
      return;
    }
  }

  const stagingRoot = await createStagingDirectory();
  const stagingProjectDir = path.join(stagingRoot, actualProjectName);

  try {
    switch (framework) {
      case "next":
        await generateNextProject(config, stagingProjectDir);
        break;

      case "vite":
        await generateViteProject(config, stagingProjectDir);
        break;

      case "express":
        await generateExpressProject(config, stagingProjectDir);
        break;

      default: {
        const unsupported: never = framework;
        throw new Error(`Unsupported framework: ${unsupported}`);
      }
    }
    console.log("Configuring Tailwind...");
    await configureTailwind(config, stagingProjectDir);

    console.log("Configuring database...");
    await configureDatabase(config, stagingProjectDir);

    console.log("Configuring authentication...");
    await configureAuth(config, stagingProjectDir);

    console.log("Configuring environment file...");
    await generateEnvFile(stagingProjectDir);

    console.log("Configuring selected tools...");
    await configureTools(config, stagingProjectDir);

    await mergeStagedFiles(stagingProjectDir, targetDir);

    console.log("Installing project dependencies...");
    await runCommand("npm", ["install"], targetDir);

    console.log(`
Project created successfully!

Project: ${projectName}
Framework: ${framework}
Location: ${targetDir}
`);
  } catch (error: unknown) {
    throw new Error(
      `Failed to generate ${framework} project: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { cause: error }
    );
  } finally {
    await fs
      .rm(stagingRoot, {
        recursive: true,
        force: true,
      })
      .catch((cleanupError: unknown) => {
        console.error(
          "Warning: Could not clean up staging directory:",
          cleanupError
        );
      });
  }
};
