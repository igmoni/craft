import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

export const honoGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const args = [
      "--yes",
      "create-hono@latest",
      projectDirectory,
      "--template=nodejs",
      "--install=false",
    ];

    await runCommand("npx", args, path.dirname(options.targetDir));
  },
};
