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

export const nestjsGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const [command, ...prefix] = packageManagerCommands[options.packageManager];

    const args = [
      ...prefix,
      "@nestjs/cli",
      "new",
      projectDirectory,
      "--package-manager",
      options.packageManager,
      "--skip-git",
      "--skip-install",
    ];

    await runCommand(command, args, path.dirname(options.targetDir));
  },
};
