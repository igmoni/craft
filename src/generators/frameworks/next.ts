import path from "node:path";
import { runCommand } from "../../services/runCommand.js";
import type { GenerateProjectConfig } from "../../types/utils.js";

export async function generateNextProject(
  config: GenerateProjectConfig,
  targetDir: string,
): Promise<void> {
  const args = [
    "--yes",
    "create-next-app@latest",
    targetDir,
    config.typeScript ? "--ts" : "--js",
    "--use-npm",
    "--skip-install",
    "--app",
    "--disable-git",
  ];

  if (config.tools.includes("eslint")) {
    args.push("--eslint");
  } else {
    args.push("--no-linter");
  }

  await runCommand("npx", args, path.dirname(targetDir));
}
