import fs from "node:fs/promises";
import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { getDlxCommand } from "../../services/packageManager.js";
import { runCommand } from "../../services/runCommand.js";

async function configurePathAlias(
  projectDir: string,
  typeScript: boolean
): Promise<void> {
  const viteConfigPath = path.join(projectDir, "vite.config.ts");

  let viteConfig = await fs.readFile(viteConfigPath, "utf-8");

  if (!viteConfig.includes('from "node:url"')) {
    viteConfig = `import { fileURLToPath } from "node:url";\n${viteConfig}`;
  }

  if (!viteConfig.includes("alias:")) {
    viteConfig = viteConfig.replace(
      "export default defineConfig({",
      `export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },`
    );
  }

  await fs.writeFile(viteConfigPath, viteConfig);

  if (typeScript) {
    const rootConfigPath = path.join(projectDir, "tsconfig.json");
    const appConfigPath = path.join(projectDir, "tsconfig.app.json");

    const rootConfig = JSON.parse(await fs.readFile(rootConfigPath, "utf-8"));

    rootConfig.compilerOptions = {
      ...rootConfig.compilerOptions,
      paths: { ...rootConfig.compilerOptions?.paths, "@/*": ["./src/*"] },
    };

    await fs.writeFile(
      rootConfigPath,
      JSON.stringify(rootConfig, null, 2) + "\n"
    );

    let appConfig = await fs.readFile(appConfigPath, "utf-8");

    appConfig = appConfig.replace(
      '"compilerOptions": {',
      '"compilerOptions": {\n    "paths": {\n      "@/*": ["./src/*"]\n    },'
    );

    await fs.writeFile(appConfigPath, appConfig);
  } else {
    await fs.writeFile(
      path.join(projectDir, "jsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            baseUrl: ".",
            paths: { "@/*": ["./src/*"] },
          },
        },
        null,
        2
      ) + "\n"
    );
  }
}

export const reactGenerator: FrameworkGenerator = {
  async generate(options) {
    const projectDirectory = path.basename(options.targetDir);
    const template = options.typeScript ? "react-ts" : "react";

    const dlx = getDlxCommand(options.packageManager, "create-vite@latest", [
      projectDirectory,
      "--template",
      template,
      "--no-interactive",
      "--no-immediate",
    ]);

    await runCommand(dlx.command, dlx.args, path.dirname(options.targetDir));

    await configurePathAlias(options.targetDir, options.typeScript);
  },
};
