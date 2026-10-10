import fs from "node:fs/promises";
import path from "node:path";
async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function readPackageJson(projectDir) {
    const packagePath = path.join(projectDir, "package.json");
    const content = await fs.readFile(packagePath, "utf8");
    return JSON.parse(content);
}
async function writePackageJson(projectDir, packageJson) {
    await fs.writeFile(path.join(projectDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
}
async function configureEslint(projectDir, packageJson, typeScript) {
    const configFiles = [
        "eslint.config.js",
        "eslint.config.mjs",
        "eslint.config.cjs",
        ".eslintrc",
        ".eslintrc.json",
        ".eslintrc.js",
        ".eslintrc.cjs",
    ];
    const hasConfig = (await Promise.all(configFiles.map((file) => exists(path.join(projectDir, file))))).some(Boolean);
    packageJson.devDependencies ??= {};
    packageJson.scripts ??= {};
    if (!hasConfig) {
        packageJson.devDependencies["eslint"] ??= "^9.0.0";
        packageJson.devDependencies["@eslint/js"] ??= "^9.0.0";
        packageJson.devDependencies["globals"] ??= "^16.0.0";
        const typescriptImports = typeScript
            ? `import tseslint from "typescript-eslint";\n`
            : "";
        const typescriptConfig = typeScript
            ? `\n  ...tseslint.configs.recommended,`
            : "";
        if (typeScript) {
            packageJson.devDependencies["typescript-eslint"] ??= "^8.0.0";
        }
        const eslintConfig = `import js from "@eslint/js";
import globals from "globals";
${typescriptImports}
export default [
  {
    ignores: ["node_modules/**", "dist/**", "build/**"],
  },
  js.configs.recommended,${typescriptConfig}
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
`;
        await fs.writeFile(path.join(projectDir, "eslint.config.mjs"), eslintConfig, { flag: "wx" });
    }
    packageJson.scripts.lint ??= "eslint .";
}
async function configurePrettier(projectDir, packageJson) {
    packageJson.devDependencies ??= {};
    packageJson.devDependencies["prettier"] ??= "^3.6.0";
    packageJson.scripts ??= {};
    packageJson.scripts.format ??=
        'prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}" "*.{js,jsx,ts,tsx,json,css,md}"';
    packageJson.scripts["format:check"] ??=
        'prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}" "*.{js,jsx,ts,tsx,json,css,md}"';
    const tsconfigPath = path.join(projectDir, "tsconfig.json");
    if (await exists(tsconfigPath)) {
        const tsconfig = await fs.readFile(tsconfigPath, "utf8");
        await fs.writeFile(tsconfigPath, `${JSON.stringify(JSON.parse(tsconfig), null, 2)}\n`);
    }
    const prettierConfig = path.join(projectDir, ".prettierrc.json");
    if (!(await exists(prettierConfig))) {
        await fs.writeFile(prettierConfig, `${JSON.stringify({
            semi: true,
            singleQuote: false,
            trailingComma: "all",
            printWidth: 80,
        }, null, 2)}\n`, { flag: "wx" });
    }
    const ignoreFile = path.join(projectDir, ".prettierignore");
    if (!(await exists(ignoreFile))) {
        await fs.writeFile(ignoreFile, "node_modules\ndist\nbuild\n.next\ncoverage\n", { flag: "wx" });
    }
}
async function configureHusky(projectDir, packageJson, useCommitlint) {
    packageJson.devDependencies ??= {};
    packageJson.scripts ??= {};
    packageJson.devDependencies["husky"] ??= "^9.1.7";
    packageJson.scripts.prepare ??= "husky";
    const huskyDir = path.join(projectDir, ".husky");
    await fs.mkdir(huskyDir, { recursive: true });
    const preCommitPath = path.join(huskyDir, "pre-commit");
    if (!(await exists(preCommitPath))) {
        const command = packageJson.scripts.lint
            ? "npm run lint"
            : "npm run format:check";
        await fs.writeFile(preCommitPath, `${command}\n`, { flag: "wx" });
    }
    if (useCommitlint) {
        const commitMsgPath = path.join(huskyDir, "commit-msg");
        if (!(await exists(commitMsgPath))) {
            await fs.writeFile(commitMsgPath, 'npx --no -- commitlint --edit "$1"\n', { flag: "wx" });
        }
    }
}
async function configureCommitlint(projectDir, packageJson) {
    packageJson.devDependencies ??= {};
    packageJson.devDependencies["@commitlint/cli"] ??= "^19.8.0";
    packageJson.devDependencies["@commitlint/config-conventional"] ??= "^19.8.0";
    const configPath = path.join(projectDir, "commitlint.config.mjs");
    if (!(await exists(configPath))) {
        await fs.writeFile(configPath, `export default {
  extends: ["@commitlint/config-conventional"],
};\n`, { flag: "wx" });
    }
}
export async function configureTools(config, projectDir) {
    const packageJson = await readPackageJson(projectDir);
    if (config.tools.includes("eslint")) {
        await configureEslint(projectDir, packageJson, config.typeScript);
    }
    if (config.tools.includes("prettier")) {
        await configurePrettier(projectDir, packageJson);
    }
    const useCommitlint = config.tools.includes("commitlint");
    const useHusky = config.tools.includes("husky") || useCommitlint;
    if (useCommitlint) {
        await configureCommitlint(projectDir, packageJson);
    }
    if (useHusky) {
        await configureHusky(projectDir, packageJson, useCommitlint);
    }
    await writePackageJson(projectDir, packageJson);
}
//# sourceMappingURL=tools.js.map