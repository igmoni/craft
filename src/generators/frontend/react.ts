import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";
import type { PackageManager } from "../../types/utils.js";

export const reactGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const args = [
      "create",
      "vite@latest",
      "--",
      projectDirectory,
      "--template",
      options.typeScript ? "react-ts" : "react",
      "--no-interactive",
      "--no-immediate",
      options.tools.includes("eslint") ? "--eslint" : "--no-eslint",
    ];

    const packageManagerCommands: Record<PackageManager, string> = {
      npm: "npm",
      bun: "bun",
      pnpm: "pnpm",
      yarn: "yarn",
    };

    await runCommand(
      packageManagerCommands[options.packageManager],
      args,
      path.dirname(options.targetDir)
    );
    console.log(`Generating React project: ${options.projectName}`);
  },
};
