import { Command } from "commander";
export const registerHelloCommand = (program) => {
    program
        .command("hello <name>")
        .description("Say Hello")
        .action((name) => {
        console.log(`Hello ${name}`);
    });
};
//# sourceMappingURL=hello.js.map