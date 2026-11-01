import path from "node:path";

import type { PackageManager } from "../../core/types/config.js";
import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

const packageManagerCommands: Record<PackageManager, string> = {
  npm: "npm",
  pnpm: "pnpm",
  yarn: "yarn",
  bun: "bun",
};

export const vueGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const args = ["create", "vue@latest", projectDirectory, "--default"];

    await runCommand(
      packageManagerCommands[options.packageManager],
      args,
      path.dirname(options.targetDir)
    );
  },
};
