import fs from "node:fs/promises";
import path from "node:path";

import type { GeneratorOptions, PackageManager } from "../core/types/config.js";
import { getRunScriptCommand } from "../services/packageManager.js";
import { pathExists } from "../utils/error.js";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

async function readPackageJson(projectDir: string): Promise<PackageJson> {
  const packagePath = path.join(projectDir, "package.json");
  if (!(await pathExists(packagePath))) {
    return {};
  }
  const content = await fs.readFile(packagePath, "utf8");
  return JSON.parse(content) as PackageJson;
}

async function writePackageJson(
  projectDir: string,
  packageJson: PackageJson
): Promise<void> {
  await fs.writeFile(
    path.join(projectDir, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
}

async function configureEslint(
  projectDir: string,
  packageJson: PackageJson,
  typeScript: boolean
): Promise<void> {
  const configFiles = [
    "eslint.config.js",
    "eslint.config.mjs",
    "eslint.config.cjs",
    "eslint.config.ts",
    ".eslintrc",
    ".eslintrc.json",
    ".eslintrc.js",
    ".eslintrc.cjs",
    ".eslintrc.yaml",
    ".eslintrc.yml",
  ];

  const hasConfig = (
    await Promise.all(
      configFiles.map((file) => pathExists(path.join(projectDir, file)))
    )
  ).some(Boolean);

  packageJson.devDependencies ??= {};
  packageJson.scripts ??= {};

  packageJson.devDependencies.eslint ??= "latest";

  if (!hasConfig) {
    packageJson.devDependencies["@eslint/js"] ??= "latest";
    packageJson.devDependencies.globals ??= "latest";

    if (typeScript) {
      packageJson.devDependencies["typescript-eslint"] ??= "latest";
    }

    const typescriptImports = typeScript
      ? 'import tseslint from "typescript-eslint";\n'
      : "";

    const typescriptConfig = typeScript
      ? "\n  ...tseslint.configs.recommended,"
      : "";

    const eslintConfig = `import js from "@eslint/js";
import globals from "globals";
${typescriptImports}
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,${typescriptConfig}
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];
`;

    await fs.writeFile(
      path.join(projectDir, "eslint.config.mjs"),
      eslintConfig,
      { flag: "wx" }
    );
  }

  packageJson.scripts.lint ??= "eslint .";
}

async function configurePrettier(
  projectDir: string,
  packageJson: PackageJson
): Promise<void> {
  packageJson.devDependencies ??= {};
  packageJson.scripts ??= {};

  packageJson.devDependencies.prettier ??= "latest";
  packageJson.devDependencies["@trivago/prettier-plugin-sort-imports"] ??=
    "latest";
  packageJson.devDependencies["prettier-plugin-tailwindcss"] ??= "latest";

  packageJson.scripts.format ??= "prettier --write .";
  packageJson.scripts["format:check"] ??= "prettier --check .";

  const prettierConfigs = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.yaml",
    ".prettierrc.yml",
    ".prettierrc.js",
    ".prettierrc.cjs",
    ".prettierrc.mjs",
    "prettier.config.js",
    "prettier.config.cjs",
    "prettier.config.mjs",
  ];

  const hasConfig = (
    await Promise.all(
      prettierConfigs.map((file) => pathExists(path.join(projectDir, file)))
    )
  ).some(Boolean);

  if (!hasConfig) {
    const config = {
      semi: true,
      trailingComma: "es5",
      singleQuote: false,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      arrowParens: "always",
      endOfLine: "lf",
      plugins: [
        "@trivago/prettier-plugin-sort-imports",
        "prettier-plugin-tailwindcss",
      ],
      importOrder: [
        "^node:",
        "^react",
        "^next",
        "<THIRD_PARTY_MODULES>",
        "^@repo/(.*)$",
        "^@/(.*)$",
        "^[./]",
      ],
      importOrderSeparation: true,
      importOrderSortSpecifiers: true,
      importOrderGroupNamespaceSpecifiers: true,
      importOrderCaseInsensitive: true,
    };

    await fs.writeFile(
      path.join(projectDir, ".prettierrc.json"),
      `${JSON.stringify(config, null, 2)}\n`,
      { flag: "wx" }
    );
  }

  const ignoreFile = path.join(projectDir, ".prettierignore");

  if (!(await pathExists(ignoreFile))) {
    const ignoreRules = [
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      ".git",
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "bun.lock",
      "bun.lockb",
    ];

    await fs.writeFile(ignoreFile, `${ignoreRules.join("\n")}\n`, {
      flag: "wx",
    });
  }
}

async function configureCommitlint(
  projectDir: string,
  packageJson: PackageJson
): Promise<void> {
  packageJson.devDependencies ??= {};
  packageJson.scripts ??= {};

  packageJson.devDependencies["@commitlint/cli"] ??= "latest";
  packageJson.devDependencies["@commitlint/config-conventional"] ??= "latest";

  packageJson.scripts.commitlint ??= "commitlint";

  const configFiles = [
    "commitlint.config.js",
    "commitlint.config.mjs",
    "commitlint.config.cjs",
  ];

  const hasConfig = (
    await Promise.all(
      configFiles.map((file) => pathExists(path.join(projectDir, file)))
    )
  ).some(Boolean);

  if (!hasConfig) {
    const config = `export default {
  extends: ["@commitlint/config-conventional"],
};
`;

    await fs.writeFile(path.join(projectDir, "commitlint.config.mjs"), config, {
      flag: "wx",
    });
  }
}

async function configureHusky(
  projectDir: string,
  packageJson: PackageJson,
  packageManager: PackageManager,
  useEslint: boolean,
  usePrettier: boolean,
  useCommitlint: boolean
): Promise<void> {
  packageJson.devDependencies ??= {};
  packageJson.scripts ??= {};

  packageJson.devDependencies.husky ??= "latest";

  if (!packageJson.scripts.prepare) {
    packageJson.scripts.prepare = "husky";
  } else if (!/\bhusky\b/.test(packageJson.scripts.prepare)) {
    packageJson.scripts.prepare += " && husky";
  }

  const huskyDir = path.join(projectDir, ".husky");
  await fs.mkdir(huskyDir, { recursive: true });

  const preCommitCommands: string[] = [];

  if (useEslint) {
    preCommitCommands.push(getRunScriptCommand(packageManager, "lint"));
  }

  if (usePrettier) {
    preCommitCommands.push(getRunScriptCommand(packageManager, "format:check"));
  }

  if (preCommitCommands.length > 0) {
    const preCommitPath = path.join(huskyDir, "pre-commit");

    if (!(await pathExists(preCommitPath))) {
      await fs.writeFile(preCommitPath, `${preCommitCommands.join("\n")}\n`, {
        flag: "wx",
      });
    }
  }

  if (useCommitlint) {
    const commitMsgPath = path.join(huskyDir, "commit-msg");

    if (!(await pathExists(commitMsgPath))) {
      const command = getRunScriptCommand(packageManager, "commitlint", [
        "--edit",
        '"$1"',
      ]);

      await fs.writeFile(commitMsgPath, `${command}\n`, { flag: "wx" });
    }
  }
}

export async function configureTools(
  config: GeneratorOptions,
  projectDir: string
): Promise<void> {
  if (config.tools.length === 0) return;

  const packageJson = await readPackageJson(projectDir);

  const useEslint = config.tools.includes("eslint");
  const usePrettier = config.tools.includes("prettier");
  const useCommitlint = config.tools.includes("commitlint");
  const useHusky = config.tools.includes("husky") || useCommitlint;

  if (useEslint) {
    await configureEslint(projectDir, packageJson, config.typeScript);
  }

  if (usePrettier) {
    await configurePrettier(projectDir, packageJson);
  }

  if (useCommitlint) {
    await configureCommitlint(projectDir, packageJson);
  }

  if (useHusky) {
    await configureHusky(
      projectDir,
      packageJson,
      config.packageManager,
      useEslint,
      usePrettier,
      useCommitlint
    );
  }

  await writePackageJson(projectDir, packageJson);
}
