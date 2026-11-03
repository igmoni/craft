import path from "node:path";
import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";
export const vueGenerator = {
    async generate(options) {
        const projectDirectory = path.basename(options.targetDir);
        const template = options.typeScript ? "vue-ts" : "vue";
        const dlx = getDlxCommand(options.packageManager, "create-vite@latest", [
            projectDirectory,
            "--template",
            template,
        ]);
        await runCommand(dlx.command, dlx.args, path.dirname(options.targetDir));
    },
};
//# sourceMappingURL=vue.js.map