import path from "node:path";

import type { PackageManager } from "../../core/types/config.js";
import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

const packageManagerCommands: Record<PackageManager, string[]> = {
  npm: ["npm", "create"],
  pnpm: ["pnpm", "create"],
  yarn: ["yarn", "create"],
  bun: ["bun", "create"],
};

export const honoGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const [command, ...prefix] = packageManagerCommands[options.packageManager];

    const args = [...prefix, "hono@latest", projectDirectory];

    await runCommand(command, args, path.dirname(options.targetDir));
  },
};
