import fs from "node:fs/promises";
import path from "node:path";
export async function configureTailwind(config, projectDir) {
    // create-next-app already configures Tailwind.
    if (config.framework !== "vite")
        return;
    const packageJsonPath = path.join(projectDir, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
    packageJson.devDependencies ??= {};
    packageJson.devDependencies.tailwindcss = "^4.1.0";
    packageJson.devDependencies["@tailwindcss/vite"] = "^4.1.0";
    await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    const configFile = path.join(projectDir, config.typeScript ? "vite.config.ts" : "vite.config.js");
    let viteConfig = await fs.readFile(configFile, "utf8");
    if (!viteConfig.includes("@tailwindcss/vite")) {
        viteConfig = `import tailwindcss from "@tailwindcss/vite";\n${viteConfig}`;
    }
    if (!viteConfig.includes("tailwindcss()")) {
        viteConfig = viteConfig.replace(/plugins:\s*\[([^\]]*)\]/, (_match, plugins) => `plugins: [${plugins.trim()}${plugins.trim() ? ", " : ""}tailwindcss()]`);
    }
    await fs.writeFile(configFile, viteConfig);
    const cssPath = path.join(projectDir, "src", "index.css");
    let css = await fs.readFile(cssPath, "utf8");
    if (!css.includes('@import "tailwindcss";')) {
        css = `@import "tailwindcss";\n\n${css}`;
    }
    await fs.writeFile(cssPath, css);
}
//# sourceMappingURL=tailwind.js.map