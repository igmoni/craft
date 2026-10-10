import path from "node:path";
import fs from "node:fs/promises";
import { confirm } from "@inquirer/prompts";
import { pathExists } from "../utils/common.js";
import { runCommand } from "../services/runCommand.js";
import { createStagingDirectory, mergeStagedFiles, } from "../services/staging.js";
import { generateNextProject } from "./frameworks/next.js";
import { generateViteProject } from "./frameworks/vite.js";
import { generateExpressProject } from "./frameworks/express.js";
import { configureTools } from "./tools.js";
export const generateProject = async (config) => {
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
            message: "This directory contains existing files. Continue without overwriting them?",
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
                const unsupported = framework;
                throw new Error(`Unsupported framework: ${unsupported}`);
            }
        }
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
    }
    catch (error) {
        throw new Error(`Failed to generate ${framework} project: ${error instanceof Error ? error.message : "Unknown error"}`, { cause: error });
    }
    finally {
        await fs.rm(stagingRoot, {
            recursive: true,
            force: true,
        });
    }
};
//# sourceMappingURL=project.js.map