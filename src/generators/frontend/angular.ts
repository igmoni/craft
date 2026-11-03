import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";

export const angularGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const dlx = getDlxCommand(options.packageManager, "@angular/cli@latest", [
      "new",
      projectDirectory,
      "--style=css",
      "--routing",
      "--skip-install",
      "--skip-git",
      "--defaults",
      `--package-manager=${options.packageManager}`,
    ]);

    await runCommand(dlx.command, dlx.args, path.dirname(options.targetDir));
  },
};
