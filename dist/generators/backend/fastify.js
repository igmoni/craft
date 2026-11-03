import fs from "node:fs/promises";
import path from "node:path";
import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";
import { pathExists } from "../../utils/error.js";
export const fastifyGenerator = {
    async generate(options) {
        const projectDirectory = path.basename(options.targetDir);
        const dlx = getDlxCommand(options.packageManager, "fastify-cli@latest", [
            "generate",
            projectDirectory,
            "--lang",
            options.typeScript ? "ts" : "js",
        ]);
        await runCommand(dlx.command, dlx.args, path.dirname(options.targetDir));
        if (options.typeScript) {
            const tsconfigPath = path.join(options.targetDir, "tsconfig.json");
            if (await pathExists(tsconfigPath)) {
                const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, "utf-8"));
                tsconfig.compilerOptions = {
                    ...tsconfig.compilerOptions,
                    rootDir: "./src",
                };
                await fs.writeFile(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
            }
        }
    },
};
//# sourceMappingURL=fastify.js.map