import { Command, Option } from "commander";
import { generateProject } from "../../core/engine/generate.js";
import { validateExistingConfig } from "../../core/engine/validate.js";
import { getFramework } from "../../core/registry/framework.js";
import { promptProjectConfig } from "../prompts/project.js";
import { displayBanner } from "../ui/banner.js";
import { logger } from "../ui/logger.js";
const supportedTools = [
    "eslint",
    "prettier",
    "husky",
    "commitlint",
];
export const parseTools = (value) => {
    const tools = value
        .split(/[,\s]+/)
        .map((tool) => tool.trim().toLowerCase())
        .filter(Boolean);
    const invalidTools = tools.filter((tool) => !supportedTools.includes(tool));
    if (invalidTools.length > 0) {
        throw new Error(`Unknown tools: ${invalidTools.join(", ")}. Supported tools: ${supportedTools.join(", ")}`);
    }
    return [...new Set(tools)];
};
export const getProvidedOptions = (command) => {
    const options = command.opts();
    const config = {};
    if (command.getOptionValueSource("framework") === "cli") {
        config.framework = options.framework;
    }
    if (command.getOptionValueSource("database") === "cli") {
        config.database = options.database;
    }
    if (command.getOptionValueSource("auth") === "cli") {
        if (options.auth === "none") {
            config.auth = false;
        }
        else {
            config.auth = options.auth;
        }
    }
    if (command.getOptionValueSource("tools") === "cli") {
        config.tools = options.tools;
    }
    if (command.getOptionValueSource("packageManager") === "cli") {
        config.packageManager = options.packageManager;
    }
    if (command.getOptionValueSource("tailwind") === "cli") {
        config.tailwind = Boolean(options.tailwind);
    }
    if (command.getOptionValueSource("shadcn") === "cli") {
        config.uiLibrary = options.shadcn ? "shadcn" : false;
    }
    return config;
};
export const registerInitCommand = (program) => {
    const init = program
        .command("init [projectName]", { isDefault: true })
        .description("Scaffold a new project with Craft");
    init.addOption(new Option("-f, --framework <framework>", "Choose a framework").choices([
        "angular",
        "vue",
        "react",
        "nestjs",
        "express",
        "fastify",
        "hono",
        "next",
    ]));
    init.addOption(new Option("--ts", "Use TypeScript"));
    init.addOption(new Option("--js", "Use JavaScript"));
    init.addOption(new Option("-d, --database <database>", "Choose a database").choices([
        "postgres",
        "mongodb",
        "none",
    ]));
    init.addOption(new Option("--auth <provider>", "Configure authentication").choices([
        "better-auth",
        "authjs",
        "clerk",
        "none",
    ]));
    init.addOption(new Option("--tailwind", "Use Tailwind CSS"));
    init.addOption(new Option("--no-tailwind", "Skip Tailwind CSS"));
    init.addOption(new Option("--shadcn", "Add shadcn/ui integration"));
    init.addOption(new Option("--no-shadcn", "Skip shadcn/ui integration"));
    init.addOption(new Option("-t, --tools <tools>", "Comma-separated tools: eslint, prettier, husky, commitlint").argParser(parseTools));
    init.addOption(new Option("-p, --package-manager <manager>", "Choose a package manager").choices(["npm", "pnpm", "yarn", "bun"]));
    init.addHelpText("after", `
Examples:
  $ craft init my-app
  $ craft init my-app --framework next --ts
  $ craft init my-app --framework react --ts --shadcn --package-manager pnpm
  $ craft init my-api --framework express --database postgres --ts
  $ craft init my-api --framework hono --ts --tools eslint,prettier
  $ craft init my-app --framework next --database postgres --auth better-auth --shadcn
`);
    init.action(async (projectName, _options, command) => {
        try {
            displayBanner();
            const providedConfig = getProvidedOptions(command);
            if (projectName) {
                providedConfig.projectName = projectName;
            }
            const options = command.opts();
            if (options.ts && options.js) {
                throw new Error("Choose either --ts or --js, not both.");
            }
            if (options.ts) {
                providedConfig.typeScript = true;
            }
            else if (options.js) {
                providedConfig.typeScript = false;
            }
            // If framework was provided via CLI, validate combinations immediately
            if (providedConfig.framework) {
                validateExistingConfig(providedConfig, providedConfig.framework);
            }
            const config = await promptProjectConfig(providedConfig);
            await generateProject(config);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "An unexpected error occurred.";
            logger.error(message);
            process.exitCode = 1;
        }
    });
};
//# sourceMappingURL=init.js.map