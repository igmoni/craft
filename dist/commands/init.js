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
    return [...new Set(tools)];
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
    init.addOption(new Option("--ts", "Use TypeScript").default(undefined));
    init.addOption(new Option("--js", "Use JavaScript").default(undefined));
    init.addOption(new Option("-d, --database <database>", "Choose a database")
        .choices(["postgres", "mongodb", "none"])
        .default("none"));
    init.addOption(new Option("--auth [provider]", "Configure authentication")
        .choices(["better-auth", "authjs", "clerk"])
        .default(false));
    init.addOption(new Option("-t, --tools <tools>", "Comma-separated tools: eslint, prettier, husky, commitlint").argParser(parseTools));
    init.addHelpText("after", `
Examples:
  $ craft init my-app
  $ craft init my-app --framework next
  $ craft init my-app --framework vite --database postgres
  $ craft init my-api --framework express --database mongodb
  $ craft init my-app --auth better-auth
  $ craft init my-app --tools eslint,prettier
`);
    init.action(async (projectName, _options, command) => {
        try {
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