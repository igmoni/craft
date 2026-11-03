import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";

export const vueGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);
    const template = options.typeScript ? "vue-ts" : "vue";

    const dlx = getDlxCommand(options.packageManager, "create-vite@latest", [
      projectDirectory,
      "--template",
      template,
      "--no-interactive",
      "--no-immediate",
    ]);

    await runCommand(dlx.command, dlx.args, path.dirname(options.targetDir));
  },
};
