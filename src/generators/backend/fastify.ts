
import path from "node:path";

import { runCommand } from "../../services/runCommand.js";
import type { PackageManager } from "../../core/types/config.js";
import type { FrameworkGenerator } from "../../core/types/generator.js";

const packageManagerCommands: Record<PackageManager, string[]> = {
  npm: ["npx", "--yes"],
  pnpm: ["pnpm", "dlx"],
  yarn: ["yarn", "dlx"],
  bun: ["bunx"],
};

export const fastifyGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const [command, ...prefix] =
      packageManagerCommands[options.packageManager];

    const args = [
      ...prefix,
      "fastify-cli",
      "generate",
      projectDirectory,
      "--lang",
      options.typeScript ? "ts" : "js",
    ];

    await runCommand(
      command,
      args,
      path.dirname(options.targetDir)
    );
  },
};
