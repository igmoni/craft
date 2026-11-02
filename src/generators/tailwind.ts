import fs from "node:fs/promises";
import path from "node:path";

import type { GenerateProjectConfig } from "../core/types/config.js";

interface PackageJson {
  devDependencies?: Record<string, string>;
}

export async function configureTailwind(
  config: GenerateProjectConfig,
  projectDir: string
): Promise<void> {
  const framework = config.framework;

  // Next.js and Angular configure Tailwind during scaffolding.
  if (framework === "next" || framework === "angular") return;

  // Tailwind integration supports React and Vue.
  if (framework !== "react" && framework !== "vue") return;

  // Update package.json.
  const packageJsonPath = path.join(projectDir, "package.json");

  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, "utf8")
  ) as PackageJson;

  packageJson.devDependencies ??= {};

  packageJson.devDependencies.tailwindcss = "^4.1.0";
  packageJson.devDependencies["@tailwindcss/vite"] = "^4.1.0";

  await fs.writeFile(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`
  );

  // Configure Vite.
  const configFile = path.join(
    projectDir,
    config.typeScript ? "vite.config.ts" : "vite.config.js"
  );

  let viteConfig = await fs.readFile(configFile, "utf8");

  if (!viteConfig.includes("@tailwindcss/vite")) {
    viteConfig = `import tailwindcss from "@tailwindcss/vite";\n${viteConfig}`;
  }

  if (!viteConfig.includes("tailwindcss()")) {
    const pluginsRegex = /(plugins\s*:\s*\[)([\s\S]*?)(\])/;

    if (!pluginsRegex.test(viteConfig)) {
      throw new Error(
        `Could not find the plugins array in ${path.basename(configFile)}.`
      );
    }

    viteConfig = viteConfig.replace(
      pluginsRegex,
      (_match, opening: string, plugins: string, closing: string) => {
        const existingPlugins = plugins.trim();

        return `${opening}${existingPlugins}${
          existingPlugins ? ", " : ""
        }tailwindcss()${closing}`;
      }
    );
  }

  await fs.writeFile(configFile, viteConfig);

  // Add Tailwind to the framework's main stylesheet.
  const cssFile = framework === "react" ? "index.css" : "style.css";

  const cssPath = path.join(projectDir, "src", cssFile);

  let css = await fs.readFile(cssPath, "utf8");

  if (!css.includes('@import "tailwindcss";')) {
    css = `@import "tailwindcss";\n\n${css}`;
  }

  await fs.writeFile(cssPath, css);
}
