import { Command, Option } from "commander";

import { generateProject } from "../generators/project.js";
import { promptProjectConfig } from "../prompts/project.js";
import type { configType, ToolType } from "../types/utils.js";

const supportedTools: ToolType[] = [
  "eslint",
  "prettier",
  "husky",
  "commitlint",
];

const parseTools = (value: string): ToolType[] => {
  const tools = value
    .split(/[,\s]+/)
    .map((tool) => tool.trim())
    .filter(Boolean);

  const invalidTools = tools.filter(
    (tool) => !supportedTools.includes(tool as ToolType),
  );

  if (invalidTools.length > 0) {
    throw new Error(`Unknown tools: ${invalidTools.join(", ")}`);
  }

  return tools as ToolType[];
};

const getProvidedOptions = (command: Command): configType => {
  const options = command.opts();
  const config: configType = {};

  if (command.getOptionValueSource("framework") === "cli") {
    config.framework = options.framework as configType["framework"];
  }

  if (command.getOptionValueSource("typeScript") === "cli") {
    config.typeScript = options.typeScript as boolean;
  }

  if (command.getOptionValueSource("database") === "cli") {
    config.database = options.database as configType["database"];
  }

  if (command.getOptionValueSource("auth") === "cli") {
    config.auth = options.auth as boolean;
  }

  if (command.getOptionValueSource("tools") === "cli") {
    config.tools = options.tools;
  }

  return config;
};

export const registerInitCommand = (program: Command) => {
  const init = program
    .command("init [projectName]")
    .description("Create a new project");

  init.addOption(
    new Option("-f, --framework <framework>", "Choose a framework")
      .choices(["next", "vite", "express"])
      .default("next"),
  );

  init.addOption(
    new Option("-t, --typeScript", "Use typeScript").default(false),
  );

  init.addOption(
    new Option("-d, --database <database>", "Choose a database")
      .choices(["postgres", "mongodb", "none"])
      .default("none"),
  );

  init.addOption(new Option("--auth", "Include authentication").default(false));

  init.addOption(
    new Option("--tools <tools>", "Choose development tools").argParser(
      parseTools,
    ),
  );

  init.action(
    async (
      projectName: string | undefined,
      options: Record<string, unknown>,
      command: Command,
    ): Promise<void> => {
      const providedConfig = getProvidedOptions(command);

      if (projectName) {
        providedConfig.projectName = projectName;
      }

      const config = await promptProjectConfig(providedConfig);

      await generateProject(config);
    },
  );
};
