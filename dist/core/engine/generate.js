import { confirm } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../../cli/ui/logger.js";
import { configureAuth } from "../../generators/auth.js";
import { configureDatabase } from "../../generators/database.js";
import { generateEnvFile } from "../../generators/env.js";
import { configureTailwind } from "../../generators/tailwind.js";
import { configureTools } from "../../generators/tools.js";
import { configureShadcn } from "../../generators/ui/shadcn.js";
import { ensurePackageManagerInstalled, getInstallCommand, getRunScriptCommand, } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";
import { createStagingDirectory, mergeStagedFiles, resolveStagingProjectDirectory, } from "../../services/staging.js";
import { getFramework } from "../registry/framework.js";
import { getGenerator } from "../registry/generators.js";
import "../registry/register-generators.js";
import { validateConfig, validateTargetDirectory } from "./validate.js";
function getErrorMessage(error) {
    return error instanceof Error ? error.message : "Unknown error";
}
export async function generateProject(config) {
    // Step 1: Validate configuration
    validateConfig(config);
    const frameworkDef = getFramework(config.framework);
    // Validate package manager exists on system before starting long process
    await ensurePackageManagerInstalled(config.packageManager);
    // Step 2: Validate target directory
    const targetInfo = await validateTargetDirectory(config.projectName);
    const { targetDir, actualProjectName, isCurrentDirectory, exists, isEmpty } = targetInfo;
    if (isCurrentDirectory && !isEmpty) {
        const shouldContinue = await confirm({
            message: "The current directory contains existing files. Continue without overwriting them?",
            default: false,
        });
        if (!shouldContinue) {
            logger.warn("Project generation cancelled by user.");
            return;
        }
    }
    // Step 3: Create temporary staging directory in the system temp directory
    logger.step(`Preparing project workspace for ${frameworkDef.name}...`);
    const stagingRoot = await createStagingDirectory();
    const stagingProjectDir = path.join(stagingRoot, actualProjectName);
    let projectMerged = false;
    try {
        // Step 4: Run framework generator
        logger.step(`Scaffolding ${frameworkDef.name} project...`);
        const generator = getGenerator(config.framework);
        await generator.generate({
            ...config,
            targetDir: stagingProjectDir,
        });
        // Locate the actual project files inside staging (handles CLI output directory variations)
        const effectiveStagingDir = await resolveStagingProjectDirectory(stagingRoot, actualProjectName);
        // Step 5: Configure Tailwind CSS (for React, Vue, Angular)
        if (frameworkDef.capabilities.tailwind &&
            config.framework !== "next" &&
            config.tailwind !== false) {
            logger.step("Configuring Tailwind CSS...");
            await configureTailwind(config, effectiveStagingDir);
        }
        // Step 6: Configure database integration
        if (config.database !== "none") {
            logger.step(`Configuring ${config.database === "postgres" ? "PostgreSQL (Prisma)" : "MongoDB (Mongoose)"}...`);
            await configureDatabase(config, effectiveStagingDir);
        }
        // Step 7: Configure authentication
        if (config.auth) {
            logger.step(`Configuring ${config.auth} authentication...`);
            await configureAuth(config, effectiveStagingDir);
        }
        // Step 8: Configure development tools
        if (config.tools.length > 0) {
            logger.step(`Configuring development tools (${config.tools.join(", ")})...`);
            await configureTools(config, effectiveStagingDir);
        }
        // Step 9: Configure environment files (.env.example -> .env)
        const envCreated = await generateEnvFile(effectiveStagingDir);
        if (envCreated) {
            logger.substep("Created initial .env from .env.example");
        }
        // Step 10: Merge staged project safely into target directory
        logger.step("Finalizing project files into destination...");
        await mergeStagedFiles(effectiveStagingDir, targetDir, isCurrentDirectory || isEmpty);
        projectMerged = true;
        // Step 11: Install dependencies with selected package manager
        logger.step(`Installing dependencies with ${config.packageManager}...`);
        const installCmd = getInstallCommand(config.packageManager);
        await runCommand(installCmd.command, installCmd.args, targetDir);
        // Step 12: Post-install integrations
        // Initialize shadcn/ui if selected (React & Next.js)
        if (config.uiLibrary === "shadcn") {
            logger.step("Initializing shadcn/ui components...");
            await configureShadcn(config, targetDir);
        }
        // Success summary
        logger.projectSummary(config, targetDir);
    }
    catch (error) {
        const message = getErrorMessage(error);
        // If merge had not completed, ensure any empty target directory is cleaned up
        if (!projectMerged && !exists) {
            try {
                const stat = await fs.lstat(targetDir).catch(() => null);
                if (stat?.isDirectory()) {
                    const entries = await fs.readdir(targetDir);
                    if (entries.length === 0) {
                        await fs.rmdir(targetDir);
                    }
                }
            }
            catch {
                // Ignore cleanup errors
            }
        }
        if (projectMerged) {
            throw new Error(`Craft generated the project files, but a later setup step failed.\n\n` +
                `${message}\n\n` +
                `Your project files are preserved at:\n  ${targetDir}\n\n` +
                `To finish setup, open the project directory and run the failed step manually.`, { cause: error });
        }
        throw new Error(`Failed to generate ${frameworkDef.name} project:\n${message}`, {
            cause: error,
        });
    }
    finally {
        // Step 13: Clean up staging directory
        try {
            await fs.rm(stagingRoot, {
                recursive: true,
                force: true,
            });
        }
        catch (cleanupError) {
            logger.warn(`Could not remove temporary staging directory: ${getErrorMessage(cleanupError)}`);
        }
    }
}
//# sourceMappingURL=generate.js.map