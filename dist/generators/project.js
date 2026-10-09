import path from "path";
import fs from "fs/promises";
import { isNodeError } from "../utils/common.js";
export const generateProject = async ({ projectName, framework, typeScript, database, auth, tools, }) => {
    console.log("Generating project");
    const isCurrentDirectory = projectName === ".";
    const projectPath = path.resolve(projectName);
    const actualProjectName = isCurrentDirectory
        ? path.basename(projectPath)
        : projectName;
    if (!isCurrentDirectory) {
        try {
            await fs.access(projectPath);
            throw new Error(`Project "${projectName}" already exists!`);
        }
        catch (error) {
            if (!isNodeError(error) || error.code !== "ENOENT") {
                // Target doesn't exist, so we'll create it below.
                throw error;
            }
        }
    }
    await fs.mkdir(projectPath, {
        recursive: true,
    });
    const entries = await fs.readdir(projectPath);
    const readmePath = path.join(projectPath, "README.md");
    try {
        await fs.access(readmePath);
        throw new Error(`README.md already exists in "${actualProjectName}".`);
    }
    catch (error) {
        if (!isNodeError(error) || error.code !== "ENOENT") {
            throw error;
        }
    }
    await fs.writeFile(path.join(readmePath), `# ${actualProjectName}\n`);
    console.log(`
    Project created successfully!
   
Project: ${projectName}
Framework: ${framework}
typeScript: ${typeScript}
Database: ${database}
Auth: ${auth}
Tools: ${tools.join(", ") || "none"}

Location: ${projectPath}
    `);
};
//# sourceMappingURL=project.js.map