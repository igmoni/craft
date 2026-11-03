#!/usr/bin/env node

import { Command } from "commander";

import { registerInitCommand } from "./cli/commands/init.js";
import {
  CRAFT_TAGLINE,
  CRAFT_VERSION,
  displayBanner,
} from "./cli/ui/banner.js";
import { logger } from "./cli/ui/logger.js";
import "./core/registry/register-generators.js";

const program = new Command();

program
  .name("craft")
  .description(`CRAFT - ${CRAFT_TAGLINE}`)
  .version(
    CRAFT_VERSION,
    "-v, --version",
    "Output the current version of Craft"
  );

registerInitCommand(program);

program.parseAsync().catch((error: unknown) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    console.log("\n  Project setup cancelled.\n");
    process.exitCode = 130;
    return;
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  logger.error(message);
  process.exitCode = 1;
});
