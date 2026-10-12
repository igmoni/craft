import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../utils/common.js";
export async function generateEnvFile(projectDir) {
    const examplePath = path.join(projectDir, ".env.example");
    const envPath = path.join(projectDir, ".env");
    // Nothing to copy if no environment template was generated.
    if (!(await pathExists(examplePath))) {
        return;
    }
    // Never overwrite an existing environment file.
    if (await pathExists(envPath)) {
        console.log("Existing .env found. Keeping it unchanged.");
        return;
    }
    await fs.copyFile(examplePath, envPath, constants.COPYFILE_EXCL);
    console.log("Created .env from .env.example");
}
//# sourceMappingURL=env.js.map