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
let startTime = 0;
program.hook("preAction", (_thisCommand, actionCommand) => {
    console.log(`Running command: ${actionCommand.name()}`);
    startTime = Date.now();
});
program.hook("postAction", (_thisCommand, actionCommand) => {
    const duration = Date.now() - startTime;
    console.log(`Finished ${actionCommand.name()} in ${duration}ms`);
});
program.parseAsync().catch((error) => {
    if (error instanceof Error && error.name === "ExitPromptError") {
        console.log("\nProject setup cancelled.");
        process.exitCode = 130;
        return;
    }
    console.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    process.exitCode = 1;
});
//# sourceMappingURL=cli.js.map