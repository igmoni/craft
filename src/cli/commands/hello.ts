import { Command } from "commander";

export const registerHelloCommand = (program: Command) => {
  program
    .command("hello <name>")
    .description("Say Hello")
    .action((name: string) => {
      console.log(`Hello ${name}`);
    });
};
