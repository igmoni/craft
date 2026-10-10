
import path from "node:path";
import { runCommand } from "../../services/runCommand.js";
import type { GenerateProjectConfig } from "../../types/utils.js";

export async function generateViteProject(
  config: GenerateProjectConfig,
  targetDir: string,
): Promise<void> {
  // Use a relative directory name inside the staging directory.
  // Passing the full Windows path causes create-vite to misinterpret it.
  const projectDirectory = path.basename(targetDir);

  const args = [
    "create",
    "vite@latest",
    "--",
    projectDirectory,
    "--template",
    config.typeScript ? "react-ts" : "react",
    "--no-interactive",
    "--no-immediate",
    config.tools.includes("eslint") ? "--eslint" : "--no-eslint",
  ];

  await runCommand("npm", args, path.dirname(targetDir));
}
