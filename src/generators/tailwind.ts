import fs from "node:fs/promises";
import path from "node:path";

import type { GenerateProjectConfig } from "../core/types/config.js";
import { pathExists } from "../utils/error.js";

interface PackageJson {
  devDependencies?: Record<string, string>;
}

export async function configureTailwind(
  config: GenerateProjectConfig,
  projectDir: string
): Promise<void> {
  const framework = config.framework;

  // Next.js configures Tailwind directly via create-next-app --tailwind
  if (framework === "next") return;

  // Backend frameworks do not use Tailwind
  if (
    framework === "express" ||
    framework === "fastify" ||
    framework === "hono" ||
    framework === "nestjs"
  ) {
    return;
  }

  const packageJsonPath = path.join(projectDir, "package.json");
  if (!(await pathExists(packageJsonPath))) return;

  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, "utf8")
  ) as PackageJson;
  packageJson.devDependencies ??= {};

  if (framework === "angular") {
    // Angular Tailwind v4 setup with @tailwindcss/postcss
    packageJson.devDependencies.tailwindcss = "latest";
    packageJson.devDependencies["@tailwindcss/postcss"] = "latest";
    packageJson.devDependencies.postcss = "latest";

    await fs.writeFile(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`
    );

    // .postcssrc.json
    const postcssPath = path.join(projectDir, ".postcssrc.json");
    if (!(await pathExists(postcssPath))) {
      const postcssConfig = {
        plugins: {
          "@tailwindcss/postcss": {},
        },
      };
      await fs.writeFile(
        postcssPath,
        `${JSON.stringify(postcssConfig, null, 2)}\n`
      );
    }

    // src/styles.css
    const stylesPath = path.join(projectDir, "src", "styles.css");
    if (await pathExists(stylesPath)) {
      let styles = await fs.readFile(stylesPath, "utf8");
      if (!styles.includes('@import "tailwindcss";')) {
        styles = `@import "tailwindcss";\n\n${styles}`;
        await fs.writeFile(stylesPath, styles);
      }
    } else {
      await fs.mkdir(path.join(projectDir, "src"), { recursive: true });
      await fs.writeFile(stylesPath, '@import "tailwindcss";\n');
    }

    return;
  }

  // React & Vue (Vite-based)
  if (framework === "react" || framework === "vue") {
    packageJson.devDependencies.tailwindcss = "latest";
    packageJson.devDependencies["@tailwindcss/vite"] = "latest";

    await fs.writeFile(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`
    );

    // Vite config
    const configFileName = config.typeScript
      ? "vite.config.ts"
      : "vite.config.js";
    const configFile = path.join(projectDir, configFileName);

    if (await pathExists(configFile)) {
      let viteConfig = await fs.readFile(configFile, "utf8");

      if (!viteConfig.includes("@tailwindcss/vite")) {
        viteConfig = `import tailwindcss from "@tailwindcss/vite";\n${viteConfig}`;
      }

      if (!viteConfig.includes("tailwindcss()")) {
        const pluginsRegex = /(plugins\s*:\s*\[)([\s\S]*?)(\])/;

        if (pluginsRegex.test(viteConfig)) {
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
      }

      await fs.writeFile(configFile, viteConfig);
    }

    // CSS entry point
    const cssFileName = framework === "react" ? "index.css" : "style.css";
    const cssPath = path.join(projectDir, "src", cssFileName);

    if (await pathExists(cssPath)) {
      let css = await fs.readFile(cssPath, "utf8");
      if (!css.includes('@import "tailwindcss";')) {
        css = `@import "tailwindcss";\n\n${css}`;
        await fs.writeFile(cssPath, css);
      }
    } else {
      await fs.mkdir(path.join(projectDir, "src"), { recursive: true });
      await fs.writeFile(cssPath, '@import "tailwindcss";\n');
    }
  }
}
