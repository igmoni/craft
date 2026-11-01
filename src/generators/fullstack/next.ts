import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

const packageManagerCommands = {
  npm: {
    command: "npx",
    prefix: ["--yes"],
  },
  pnpm: {
    command: "pnpm",
    prefix: ["dlx"],
  },
  yarn: {
    command: "yarn",
    prefix: ["dlx"],
  },
  bun: {
    command: "bunx",
    prefix: [],
  },
} as const;

export const nextGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);
    const packageManager = packageManagerCommands[options.packageManager];

    const args = [
      ...packageManager.prefix,
      "create-next-app@latest",
      projectDirectory,
      options.typeScript ? "--ts" : "--js",
      "--yes",
      "--app",
      "--disable-git",
      "--skip-install",
      options.tools.includes("eslint") ? "--eslint" : "--no-linter",
    ];

    await runCommand(
      packageManager.command,
      args,
      path.dirname(options.targetDir)
    );
  },
};
