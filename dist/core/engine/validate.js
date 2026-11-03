import fs from "node:fs/promises";
import path from "node:path";
import { getFramework, isFrameworkSupported } from "../registry/framework.js";
export function validateProjectName(value) {
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
export function normalizeProjectName(value) {
    const name = value.trim();
    return name === "." ? "." : name;
}
export async function validateTargetDirectory(projectName) {
    const isCurrentDirectory = projectName === ".";
    const targetDir = path.resolve(projectName);
    const actualProjectName = path.basename(targetDir);
    if (!actualProjectName || targetDir === path.parse(targetDir).root) {
        throw new Error("The filesystem root cannot be used as a project directory.");
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
    }
    catch (error) {
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ENOENT") {
            exists = false;
            isEmpty = true;
        }
        else {
            throw error;
        }
    }
    if (exists && !isCurrentDirectory && !isEmpty) {
        throw new Error(`Directory "${actualProjectName}" already exists and is not empty. Please choose a different name or use an empty directory.`);
    }
    return {
        targetDir,
        actualProjectName,
        isCurrentDirectory,
        exists,
        isEmpty,
    };
}
export function validateExistingConfig(config, framework) {
    if (!isFrameworkSupported(framework)) {
        throw new Error(`Unknown framework: "${framework}"`);
    }
    const frameworkInfo = getFramework(framework);
    const capabilities = frameworkInfo.capabilities;
    if (config.typeScript === true && !capabilities.typescript) {
        throw new Error(`${frameworkInfo.name} does not support TypeScript.`);
    }
    if (config.typeScript === false && !capabilities.javascript) {
        throw new Error(`${frameworkInfo.name} does not support JavaScript. Only TypeScript is supported.`);
    }
    if (config.database !== undefined && config.database !== "none") {
        if (!capabilities.database) {
            throw new Error(`${frameworkInfo.name} does not support Craft database integration.`);
        }
        if (!capabilities.databases.includes(config.database)) {
            const supported = capabilities.databases.length > 0
                ? capabilities.databases.join(", ")
                : "none";
            throw new Error(`${config.database} database is not supported for ${frameworkInfo.name}. (Supported: ${supported})`);
        }
    }
    if (config.auth && !capabilities.authProviders.includes(config.auth)) {
        const supported = capabilities.authProviders.length > 0
            ? capabilities.authProviders.join(", ")
            : "none";
        throw new Error(`${config.auth} authentication is not supported for ${frameworkInfo.name}. (Supported: ${supported})`);
    }
    if (config.tailwind === true && !capabilities.styling.includes("tailwind")) {
        throw new Error(`Tailwind CSS is not supported for ${frameworkInfo.name}.`);
    }
    if (config.uiLibrary === "shadcn") {
        if (!capabilities.shadcn) {
            throw new Error(`shadcn/ui is not supported for ${frameworkInfo.name}. Only React (Vite) and Next.js are supported.`);
        }
        if (config.tailwind === false) {
            throw new Error(`shadcn/ui requires Tailwind CSS. Please enable Tailwind CSS or remove shadcn/ui.`);
        }
    }
    if (config.packageManager &&
        !capabilities.packageManagers.includes(config.packageManager)) {
        throw new Error(`Unsupported package manager "${config.packageManager}" for ${frameworkInfo.name}. (Supported: ${capabilities.packageManagers.join(", ")})`);
    }
    if (config.tools) {
        for (const tool of config.tools) {
            if (!capabilities.tools.includes(tool)) {
                throw new Error(`Tool "${tool}" is not supported for ${frameworkInfo.name}. (Supported: ${capabilities.tools.join(", ")})`);
            }
        }
    }
}
export function validateConfig(config) {
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
        throw new Error(`${framework.name} does not support TypeScript scaffolding.`);
    }
    if (!config.typeScript && !capabilities.javascript) {
        throw new Error(`${framework.name} does not support JavaScript scaffolding.`);
    }
    if (config.database !== "none") {
        if (!capabilities.database) {
            throw new Error(`${framework.name} does not support Craft database integration.`);
        }
        if (!capabilities.databases.includes(config.database)) {
            throw new Error(`${config.database} database is not supported for ${framework.name}.`);
        }
    }
    if (config.auth && !capabilities.authProviders.includes(config.auth)) {
        throw new Error(`${config.auth} authentication is not supported for ${framework.name}.`);
    }
    if (config.tailwind === true && !capabilities.styling.includes("tailwind")) {
        throw new Error(`Tailwind CSS is not supported for ${framework.name}.`);
    }
    if (config.uiLibrary === "shadcn") {
        if (!capabilities.shadcn) {
            throw new Error(`shadcn/ui is not supported for ${framework.name}.`);
        }
        if (config.tailwind === false) {
            throw new Error(`shadcn/ui requires Tailwind CSS. Please enable Tailwind CSS or remove shadcn/ui.`);
        }
    }
    if (!capabilities.packageManagers.includes(config.packageManager)) {
        throw new Error(`Unsupported package manager "${config.packageManager}" for ${framework.name}. Supported: ${capabilities.packageManagers.join(", ")}`);
    }
    if (config.tools) {
        for (const tool of config.tools) {
            if (!capabilities.tools.includes(tool)) {
                throw new Error(`Tool "${tool}" is not supported for ${framework.name}. Supported: ${capabilities.tools.join(", ")}`);
            }
        }
    }
}
//# sourceMappingURL=validate.js.map