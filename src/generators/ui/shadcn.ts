import type {
  GeneratorOptions,
  PackageManager,
} from "../../core/types/config.js";
import { runCommand } from "../../services/runCommand.js";

const packageManagerCommands: Record<PackageManager, string[]> = {
  npm: ["npx", "--yes"],
  pnpm: ["pnpm", "dlx"],
  yarn: ["yarn", "dlx"],
  bun: ["bunx", "--bun"],
};

export async function configureShadcn(
  config: GeneratorOptions,
  projectDir: string
): Promise<void> {
  if (config.uiLibrary !== "shadcn") return;

  if (config.framework !== "next" && config.framework !== "react") {
    throw new Error(`shadcn/ui is not supported for ${config.framework}.`);
  }

  const [command, ...prefix] = packageManagerCommands[config.packageManager];

  const template = config.framework === "next" ? "next" : "vite";

  const args = [
    ...prefix,
    "shadcn@latest",
    "init",
    `--template=${template}`,
    "--preset=nova",
    "--yes",
    "--no-monorepo",
  ];

  await runCommand(command, args, projectDir);
}
