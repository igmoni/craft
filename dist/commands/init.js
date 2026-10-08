import { Command } from "commander";
import { generateProject } from "../generators/project.js";
export const registerInitCommand = (program) => {
    program
        .command("init [projectName]")
        .description("Initalizes project")
        .action((projectName) => {
        console.log(`Initalizing project ${projectName}`);
        generateProject({
            projectName,
            framework: "next",
            typeScript: true,
            database: "none",
            auth: false,
            tools: [],
        });
    });
};
//# sourceMappingURL=init.js.map