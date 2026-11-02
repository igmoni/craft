import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

export const angularGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const args = [
      "--yes",
      "@angular/cli@latest",
      "new",
      projectDirectory,
      "--skip-install",
      "--skip-git",
      "--defaults",
      "--package-manager",
      options.packageManager,
      "--style=tailwind",
    ];

    await runCommand("npx", args, path.dirname(options.targetDir));
  },
};
