import path from "node:path";

import type { PackageManager } from "../../core/types/config.js";
import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

interface PackageManagerCommand {
  command: string;
  prefix: string[];
}

const packageManagerCommands: Record<PackageManager, PackageManagerCommand> = {
  npm: {
    command: "npm",
    prefix: ["create", "vite@latest"],
  },
  pnpm: {
    command: "pnpm",
    prefix: ["create", "vite@latest"],
  },
  yarn: {
    command: "yarn",
    prefix: ["create", "vite"],
  },
  bun: {
    command: "bun",
    prefix: ["create", "vite@latest"],
  },
};

export const reactGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);
    const { command, prefix } = packageManagerCommands[options.packageManager];

    const args = [...prefix, projectDirectory];

    if (options.packageManager === "npm") {
      args.push("--");
    }

    args.push(
      "--template",
      options.typeScript ? "react-ts" : "react",
      "--no-interactive",
      "--no-immediate",
      options.tools.includes("eslint") ? "--eslint" : "--no-eslint"
    );

    await runCommand(command, args, path.dirname(options.targetDir));
  },
};
