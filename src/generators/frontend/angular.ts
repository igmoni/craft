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

export const angularGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const args = [
      "exec",
      "--yes",
      "@angular/cli",
      "--",
      "new",
      projectDirectory,
      "--skip-install",
      "--skip-git",
      "--defaults",
      "--package-manager",
      options.packageManager,
    ];

    await runCommand(
      packageManagerCommands[options.packageManager],
      args,
      path.dirname(options.targetDir)
    );
  },
};
