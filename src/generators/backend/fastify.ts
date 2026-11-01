import fs from "node:fs/promises";
import path from "node:path";

import type { PackageManager } from "../../core/types/config.js";
import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

const packageManagerCommands: Record<PackageManager, string[]> = {
  npm: ["npx", "--yes"],
  pnpm: ["pnpm", "dlx"],
  yarn: ["yarn", "dlx"],
  bun: ["bunx"],
};

export const fastifyGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const [command, ...prefix] = packageManagerCommands[options.packageManager];

    const args = [
      ...prefix,
      "fastify-cli",
      "generate",
      projectDirectory,
      "--lang",
      options.typeScript ? "ts" : "js",
    ];

    await runCommand(command, args, path.dirname(options.targetDir));

    if (options.typeScript) {
      const tsconfigPath = path.join(options.targetDir, "tsconfig.json");

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
  },
};
