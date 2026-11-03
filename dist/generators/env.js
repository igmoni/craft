import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../utils/error.js";
export async function generateEnvFile(projectDir) {
    const examplePath = path.join(projectDir, ".env.example");
    const envPath = path.join(projectDir, ".env");
    // Nothing to copy if no environment template was generated
    if (!(await pathExists(examplePath))) {
        return false;
    }
    // Never overwrite an existing environment file
    if (await pathExists(envPath)) {
        return false;
    }
    await fs.copyFile(examplePath, envPath, constants.COPYFILE_EXCL);
    return true;
}
//# sourceMappingURL=env.js.map