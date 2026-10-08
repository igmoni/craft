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
program.parseAsync();
//# sourceMappingURL=cli.js.map