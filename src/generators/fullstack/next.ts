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

export const nextGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const [command, ...prefix] = packageManagerCommands[options.packageManager];

    const args = [
      ...prefix,
      "create-next-app@latest",
      projectDirectory,
      options.typeScript ? "--ts" : "--js",
      "--yes",
      "--tailwind",
      "--disable-git",
      "--skip-install",
      options.tools.includes("eslint") ? "--eslint" : "--no-linter",
    ];

    await runCommand(command, args, path.dirname(options.targetDir));
  },
};
