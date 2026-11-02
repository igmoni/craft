import fs from "node:fs/promises";
import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";
import { runCommand } from "../../services/runCommand.js";

interface PackageJson {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export const honoGenerator: FrameworkGenerator = {
  async generate(options) {
    const targetDir = options.targetDir;
    const projectDirectory = path.basename(targetDir);

    const args = [
      "--yes",
      "create-hono@latest",
      projectDirectory,
      "--template=nodejs",
    ];

    await runCommand("npx", args, path.dirname(targetDir));

    if (options.typeScript) return;

    const sourceDir = path.join(targetDir, "src");
    const tsEntry = path.join(sourceDir, "index.ts");
    const jsEntry = path.join(sourceDir, "index.js");

    await fs.rename(tsEntry, jsEntry);

    const tsconfigPath = path.join(targetDir, "tsconfig.json");
    await fs.rm(tsconfigPath, { force: true });

    const packageJsonPath = path.join(targetDir, "package.json");

    const packageJson = JSON.parse(
      await fs.readFile(packageJsonPath, "utf8")
    ) as PackageJson;

    if (packageJson.devDependencies) {
      delete packageJson.devDependencies["@types/node"];
      delete packageJson.devDependencies.tsx;
      delete packageJson.devDependencies.typescript;

      if (Object.keys(packageJson.devDependencies).length === 0) {
        delete packageJson.devDependencies;
      }
    }

    packageJson.scripts = {
      ...packageJson.scripts,
      dev: "node --watch src/index.js",
      start: "node src/index.js",
    };

    delete packageJson.scripts.build;

    await fs.writeFile(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`
    );
  },
};
