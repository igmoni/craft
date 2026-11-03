import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";

export const nextGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);

    const pmFlag =
      options.packageManager === "pnpm"
        ? "--use-pnpm"
        : options.packageManager === "yarn"
          ? "--use-yarn"
          : options.packageManager === "bun"
            ? "--use-bun"
            : "--use-npm";

    const dlx = getDlxCommand(
      options.packageManager,
      "create-next-app@latest",
      [
        projectDirectory,
        options.typeScript ? "--ts" : "--js",
        options.tailwind !== false ? "--tailwind" : "--no-tailwind",
        "--app",
        "--src-dir",
        "--import-alias",
        "@/*",
        pmFlag,
        "--yes",
        "--disable-git",
        "--skip-install",
        options.tools.includes("eslint") ? "--eslint" : "--no-eslint",
      ]
    );

    await runCommand(dlx.command, dlx.args, path.dirname(options.targetDir));
  },
};
