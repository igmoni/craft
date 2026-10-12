import { Command, Option } from "commander";
import { generateProject } from "../generators/project.js";
import { promptProjectConfig } from "../prompts/project.js";
const supportedTools = [
    "eslint",
    "prettier",
    "husky",
    "commitlint",
];
const parseTools = (value) => {
    const tools = value
        .split(/[,\s]+/)
        .map((tool) => tool.trim())
        .filter(Boolean);
    const invalidTools = tools.filter((tool) => !supportedTools.includes(tool));
    if (invalidTools.length > 0) {
        throw new Error(`Unknown tools: ${invalidTools.join(", ")}`);
    }
    return tools;
};
const getProvidedOptions = (command) => {
    const options = command.opts();
    const config = {};
    if (command.getOptionValueSource("framework") === "cli") {
        config.framework = options.framework;
    }
    if (command.getOptionValueSource("typeScript") === "cli") {
        config.typeScript = options.typeScript;
    }
    if (command.getOptionValueSource("database") === "cli") {
        config.database = options.database;
    }
    if (command.getOptionValueSource("auth") === "cli") {
        config.auth = options.auth;
    }
    if (command.getOptionValueSource("tools") === "cli") {
        config.tools = options.tools;
    }
    return config;
};
export const registerInitCommand = (program) => {
    const init = program
        .command("init [projectName]")
        .description("Create a new project");
    init.addOption(new Option("-f, --framework <framework>", "Choose a framework")
        .choices(["next", "vite", "express"])
        .default("next"));
    init.addOption(new Option("-t, --typeScript", "Use typeScript").default(false));
    init.addOption(new Option("-d, --database <database>", "Choose a database")
        .choices(["postgres", "mongodb", "none"])
        .default("none"));
    init.addOption(new Option("--auth [provider]", "Configure an authentication provider")
        .choices(["better-auth", "authjs", "clerk"])
        .default(false));
    init.addOption(new Option("--tools <tools>", "Choose development tools").argParser(parseTools));
    init.action(async (projectName, options, command) => {
        try {
            const providedConfig = getProvidedOptions(command);
            if (projectName) {
                providedConfig.projectName = projectName;
            }
            const config = await promptProjectConfig(providedConfig);
            await generateProject(config);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "An unexpected error occurred.";
            console.error(`\nError: ${message}`);
            process.exitCode = 1;
        }
    });
};
//# sourceMappingURL=init.js.map