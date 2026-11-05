import fs from "node:fs/promises";
import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import {
  getDlxCommand,
  getRunScriptCommand,
} from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";
import { pathExists } from "../../utils/error.js";

export const fastifyGenerator: FrameworkGenerator = {
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
        await fs.writeFile(
          tsconfigPath,
          `${JSON.stringify(tsconfig, null, 2)}\n`
        );
      }
    }

    // Standardize generated project with a "build" script alias for compilation
    const packageJsonPath = path.join(options.targetDir, "package.json");
    if (await pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8")
      );
      if (packageJson.scripts) {
        if (!packageJson.scripts.build && packageJson.scripts["build:ts"]) {
          packageJson.scripts.build = getRunScriptCommand(
            options.packageManager,
            "build:ts"
          );
          await fs.writeFile(
            packageJsonPath,
            `${JSON.stringify(packageJson, null, 2)}\n`
          );
        }
      }
    }
  },
};
