import fs from "node:fs/promises";
export function isNodeError(error) {
    return error instanceof Error;
}
export async function pathExists(targetPath) {
    try {
        await fs.access(targetPath);
        return true;
    }
    catch (error) {
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
}
//# sourceMappingURL=common.js.map