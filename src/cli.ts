#!/usr/bin/env node

import { Command } from "commander";

import { registerHelloCommand } from "./commands/hello.js";
import { registerInitCommand } from "./commands/init.js";

const program = new Command();

program
  .name("craft")
  .description("A CLI for setting up projects")
  .version("1.0.0");

registerHelloCommand(program);

registerInitCommand(program);

let startTime: any;

program.hook("preAction", (thisCommand, actionCommand) => {
  console.log(`Running command: ${actionCommand.name()}`);
  startTime = Date.now();
});

program.hook("postAction", (thisCommand, actionCommand) => {
  const duration = Date.now() - startTime;

  console.log(`Finished ${actionCommand.name()} in ${duration}ms`);
});

program.parseAsync();
