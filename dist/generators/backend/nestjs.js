import path from "node:path";
import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";
export const nestjsGenerator = {
    async generate(options) {
        const projectDirectory = path.basename(options.targetDir);
        const dlx = getDlxCommand(options.packageManager, "@nestjs/cli@latest", [
            "new",
            projectDirectory,
            "--package-manager",
            options.packageManager,
            "--language",
            options.typeScript ? "TS" : "JS",
            "--skip-git",
            "--skip-install",
        ]);
        await runCommand(dlx.command, dlx.args, path.dirname(options.targetDir));
    },
};
//# sourceMappingURL=nestjs.js.map