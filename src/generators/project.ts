import path from "path";
import fs from "fs/promises";

import { confirm } from "@inquirer/prompts";

import { isNodeError, pathExists } from "../utils/common.js";

import type { GenerateProjectConfig } from "../types/utils.js";

export const generateProject = async ({
  projectName,
  framework,
  typeScript,
  database,
  auth,
  tools,
}: GenerateProjectConfig): Promise<void> => {
  console.log("Generating project");

  const isCurrentDirectory = projectName === ".";
  const projectPath = path.resolve(projectName);

  const actualProjectName = isCurrentDirectory
    ? path.basename(projectPath)
    : projectName;

  // Phase 1: Inspect the target without modifying it.
  const targetExists = await pathExists(projectPath);

  if (targetExists && !isCurrentDirectory) {
    throw new Error(`Project "${projectName}" already exists!`);
  }

  const entries = targetExists ? await fs.readdir(projectPath) : [];

  const readmePath = path.join(projectPath, "README.md");

  // Phase 2: Detect conflicts before asking to proceed.
  if (await pathExists(readmePath)) {
    throw new Error(
      `Cannot generate project: README.md already exists in "${actualProjectName}".`,
    );
  }

  // Phase 3: Ask permission when using a non-empty current directory.
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

  // Phase 4: Begin writing only after preflight checks pass.
  await fs.mkdir(projectPath, { recursive: true });

  await fs.writeFile(readmePath, `# ${actualProjectName}\n`, {
    flag: "wx",
  });

  console.log(`
    Project created successfully!

    Project: ${projectName}
    Framework: ${framework}
    TypeScript: ${typeScript}
    Database: ${database}
    Auth: ${auth}
    Tools: ${tools.join(", ") || "none"}

    Location: ${projectPath}
  `);
};
