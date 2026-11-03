import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";
export async function configureShadcn(config, projectDir) {
    if (config.uiLibrary !== "shadcn")
        return;
    if (config.framework !== "next" && config.framework !== "react") {
        throw new Error(`shadcn/ui is not supported for "${config.framework}". Only Next.js and React (Vite) are supported.`);
    }
    const template = config.framework === "next" ? "next" : "vite";
    const dlx = getDlxCommand(config.packageManager, "shadcn@latest", [
        "init",
        `--template=${template}`,
        "--defaults",
        "--yes",
        "--no-monorepo",
    ]);
    await runCommand(dlx.command, dlx.args, projectDir);
}
//# sourceMappingURL=shadcn.js.map