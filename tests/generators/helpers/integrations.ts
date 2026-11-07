import fs from "node:fs/promises";
import path from "node:path";

import type { FrameworkType } from "../../../dist/core/types/framework.js";
import { pathExists } from "../../../dist/utils/error.js";
import type { CheckResult } from "../types.ts";

async function readJsonSafe(
  filePath: string
): Promise<Record<string, any> | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Verifies that Prisma schema, client connection helper, and scripts are properly configured.
 */
export async function verifyPrismaIntegration(
  projectDir: string,
  enabled: boolean
): Promise<CheckResult> {
  if (!enabled) {
    return {
      name: "Prisma (PostgreSQL)",
      status: "skipped",
      message: "Database integration not selected",
    };
  }

  const failures: string[] = [];
  const schemaPath = path.join(projectDir, "prisma", "schema.prisma");

  if (!(await pathExists(schemaPath))) {
    failures.push("prisma/schema.prisma missing");
  } else {
    const schemaContent = (await readFileSafe(schemaPath)) || "";
    if (!schemaContent.includes('provider = "prisma-client"')) {
      failures.push('schema.prisma missing "prisma-client" generator');
    }
    if (schemaContent.includes('provider = "prisma-client-js"')) {
      failures.push(
        'schema.prisma should not use deprecated "prisma-client-js"'
      );
    }
    if (!schemaContent.includes('output   = "../src/generated/prisma"')) {
      failures.push('schema.prisma missing "../src/generated/prisma" output');
    }
    if (!schemaContent.includes('provider = "postgresql"')) {
      failures.push("schema.prisma missing postgresql datasource provider");
    }
    if (schemaContent.includes("url")) {
      failures.push(
        "schema.prisma should not contain url inside datasource block in Prisma 7"
      );
    }
  }

  // Check root-level prisma.config.ts
  const configPath = path.join(projectDir, "prisma.config.ts");
  if (!(await pathExists(configPath))) {
    failures.push("prisma.config.ts missing");
  } else {
    const configContent = (await readFileSafe(configPath)) || "";
    if (!configContent.includes("defineConfig")) {
      failures.push('prisma.config.ts missing "defineConfig"');
    }
    if (!configContent.includes('env("DATABASE_URL")')) {
      failures.push('prisma.config.ts missing env("DATABASE_URL")');
    }
  }

  // Check database client file (src/db.ts or src/lib/db.ts or .js)
  const clientCandidates = [
    path.join(projectDir, "src", "db.ts"),
    path.join(projectDir, "src", "db.js"),
    path.join(projectDir, "src", "lib", "db.ts"),
    path.join(projectDir, "lib", "db.ts"),
  ];

  const existingClient = (
    await Promise.all(
      clientCandidates.map(async (p) => ((await pathExists(p)) ? p : null))
    )
  ).find(Boolean);

  if (!existingClient) {
    failures.push("Database client file (db.ts/db.js) missing");
  } else {
    const clientContent = (await readFileSafe(existingClient)) || "";
    if (!clientContent.includes("PrismaPg")) {
      failures.push("Database client missing PrismaPg adapter");
    }
    if (!clientContent.includes("DATABASE_URL")) {
      failures.push("Database client missing DATABASE_URL validation");
    }
  }

  // Check package.json scripts and dependencies
  const pkg = await readJsonSafe(path.join(projectDir, "package.json"));
  if (pkg) {
    const scripts = pkg.scripts || {};
    if (!scripts["db:generate"]) {
      failures.push('package.json missing "db:generate" script');
    }
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};
    if (!deps["@prisma/client"]) {
      failures.push('package.json missing "@prisma/client" dependency');
    }
    if (!deps["@prisma/adapter-pg"]) {
      failures.push('package.json missing "@prisma/adapter-pg" dependency');
    }
    if (!deps.pg) {
      failures.push('package.json missing "pg" dependency');
    }
    if (!devDeps.prisma && !deps.prisma) {
      failures.push('package.json missing "prisma" devDependency');
    }
  } else {
    failures.push("package.json could not be read");
  }

  if (failures.length > 0) {
    return {
      name: "Prisma (PostgreSQL)",
      status: "failed",
      message: failures.join("; "),
    };
  }

  return {
    name: "Prisma (PostgreSQL)",
    status: "passed",
    message:
      "Schema, config, client, adapter, environment variables, and scripts verified",
  };
}

/**
 * Verifies that Tailwind CSS configuration and entry stylesheets are configured.
 */
export async function verifyTailwindIntegration(
  projectDir: string,
  framework: FrameworkType,
  enabled: boolean
): Promise<CheckResult> {
  if (!enabled) {
    return {
      name: "Tailwind CSS",
      status: "skipped",
      message: "Tailwind CSS not configured for this framework",
    };
  }

  const failures: string[] = [];
  const pkg = await readJsonSafe(path.join(projectDir, "package.json"));

  if (framework === "angular") {
    // Angular: .postcssrc.json with @tailwindcss/postcss and src/styles.css with @import "tailwindcss";
    const postcssPath = path.join(projectDir, ".postcssrc.json");
    if (!(await pathExists(postcssPath))) {
      failures.push(".postcssrc.json missing");
    } else {
      const content = await readFileSafe(postcssPath);
      if (!content || !content.includes("@tailwindcss/postcss")) {
        failures.push(".postcssrc.json missing @tailwindcss/postcss plugin");
      }
    }

    const stylesPath = path.join(projectDir, "src", "styles.css");
    const stylesContent = await readFileSafe(stylesPath);
    if (!stylesContent || !stylesContent.includes('@import "tailwindcss";')) {
      failures.push('src/styles.css missing @import "tailwindcss";');
    }

    if (pkg) {
      const devDeps = pkg.devDependencies || {};
      if (!devDeps["@tailwindcss/postcss"]) {
        failures.push('Missing "@tailwindcss/postcss" devDependency');
      }
    }
  } else if (framework === "react" || framework === "vue") {
    // Vite-based frameworks: vite.config.ts with @tailwindcss/vite and css with @import "tailwindcss";
    const viteConfigCandidates = [
      path.join(projectDir, "vite.config.ts"),
      path.join(projectDir, "vite.config.js"),
      path.join(projectDir, "vite.config.mjs"),
    ];

    let hasVitePlugin = false;
    for (const vPath of viteConfigCandidates) {
      const content = await readFileSafe(vPath);
      if (content && content.includes("@tailwindcss/vite")) {
        hasVitePlugin = true;
        break;
      }
    }

    if (!hasVitePlugin) {
      failures.push("vite.config missing @tailwindcss/vite integration");
    }

    const cssCandidates = [
      path.join(projectDir, "src", "index.css"),
      path.join(projectDir, "src", "style.css"),
    ];

    let hasCssImport = false;
    for (const cPath of cssCandidates) {
      const content = await readFileSafe(cPath);
      if (content && content.includes('@import "tailwindcss";')) {
        hasCssImport = true;
        break;
      }
    }

    if (!hasCssImport) {
      failures.push('CSS entry point missing @import "tailwindcss";');
    }

    if (pkg) {
      const devDeps = pkg.devDependencies || {};
      if (!devDeps["@tailwindcss/vite"]) {
        failures.push('Missing "@tailwindcss/vite" devDependency');
      }
    }
  } else if (framework === "next") {
    // Next.js: create-next-app native tailwind integration
    const hasNextTailwind =
      (await pathExists(path.join(projectDir, "postcss.config.mjs"))) ||
      (await pathExists(path.join(projectDir, "postcss.config.js"))) ||
      (await pathExists(path.join(projectDir, "src", "app", "globals.css"))) ||
      (await pathExists(path.join(projectDir, "app", "globals.css")));

    if (!hasNextTailwind) {
      failures.push("Next.js Tailwind configuration files missing");
    }
  }

  if (failures.length > 0) {
    return {
      name: "Tailwind CSS",
      status: "failed",
      message: failures.join("; "),
    };
  }

  return {
    name: "Tailwind CSS",
    status: "passed",
    message: "Styling plugin, configuration, and stylesheet import verified",
  };
}

/**
 * Verifies that shadcn/ui is configured where selected.
 */
export async function verifyShadcnIntegration(
  projectDir: string,
  enabled: boolean
): Promise<CheckResult> {
  if (!enabled) {
    return {
      name: "shadcn/ui",
      status: "skipped",
      message: "shadcn/ui not selected or not applicable",
    };
  }

  const componentsJsonPath = path.join(projectDir, "components.json");
  if (!(await pathExists(componentsJsonPath))) {
    return {
      name: "shadcn/ui",
      status: "failed",
      message: "components.json configuration missing",
    };
  }

  return {
    name: "shadcn/ui",
    status: "passed",
    message: "components.json configured",
  };
}

/**
 * Verifies that ESLint configuration and scripts are present.
 */
export async function verifyEslintIntegration(
  projectDir: string,
  enabled: boolean
): Promise<CheckResult> {
  if (!enabled) {
    return {
      name: "ESLint",
      status: "skipped",
      message: "ESLint not selected for this project",
    };
  }

  const configCandidates = [
    "eslint.config.mjs",
    "eslint.config.js",
    "eslint.config.cjs",
    "eslint.config.ts",
    ".eslintrc.json",
    ".eslintrc.js",
  ];

  const hasConfig = (
    await Promise.all(
      configCandidates.map((file) => pathExists(path.join(projectDir, file)))
    )
  ).some(Boolean);

  if (!hasConfig) {
    return {
      name: "ESLint",
      status: "failed",
      message: "ESLint configuration file missing",
    };
  }

  const pkg = await readJsonSafe(path.join(projectDir, "package.json"));
  if (pkg && !pkg.scripts?.lint) {
    // If framework CLI already has lint or craft configured lint
    if (!pkg.devDependencies?.eslint && !pkg.dependencies?.eslint) {
      return {
        name: "ESLint",
        status: "failed",
        message: 'ESLint package missing in dependencies and no "lint" script',
      };
    }
  }

  return {
    name: "ESLint",
    status: "passed",
    message: "Config file and lint script verified",
  };
}

/**
 * Verifies that Prettier configuration and ignore files are present.
 */
export async function verifyPrettierIntegration(
  projectDir: string,
  enabled: boolean
): Promise<CheckResult> {
  if (!enabled) {
    return {
      name: "Prettier",
      status: "skipped",
      message: "Prettier not selected for this project",
    };
  }

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

  let foundConfig: string | null = null;
  for (const configFile of prettierConfigs) {
    if (await pathExists(path.join(projectDir, configFile))) {
      foundConfig = configFile;
      break;
    }
  }

  if (!foundConfig) {
    return {
      name: "Prettier",
      status: "failed",
      message:
        "Prettier configuration file missing (.prettierrc, .prettierrc.json, etc.)",
    };
  }

  const hasIgnore = await pathExists(path.join(projectDir, ".prettierignore"));
  if (!hasIgnore) {
    return {
      name: "Prettier",
      status: "failed",
      message: ".prettierignore file missing",
    };
  }

  const pkg = await readJsonSafe(path.join(projectDir, "package.json"));
  if (pkg) {
    const hasFormatScript =
      pkg.scripts?.format || pkg.scripts?.["format:check"];
    const hasPrettierDep =
      pkg.devDependencies?.prettier || pkg.dependencies?.prettier;

    if (!hasFormatScript && !hasPrettierDep) {
      return {
        name: "Prettier",
        status: "failed",
        message:
          'Prettier is not configured in package.json (missing "format" script and dependency)',
      };
    }
  }

  return {
    name: "Prettier",
    status: "passed",
    message: `${foundConfig} and .prettierignore verified`,
  };
}

/**
 * Verifies Husky and Commitlint configuration.
 */
export async function verifyHuskyCommitlintIntegration(
  projectDir: string,
  huskyEnabled: boolean,
  commitlintEnabled: boolean
): Promise<CheckResult> {
  if (!huskyEnabled && !commitlintEnabled) {
    return {
      name: "Husky / Commitlint",
      status: "skipped",
      message: "Git hooks and Commitlint not selected",
    };
  }

  const failures: string[] = [];

  if (huskyEnabled) {
    const huskyDir = path.join(projectDir, ".husky");
    if (!(await pathExists(huskyDir))) {
      failures.push(".husky directory missing");
    }
  }

  if (commitlintEnabled) {
    const configCandidates = [
      "commitlint.config.mjs",
      "commitlint.config.js",
      "commitlint.config.cjs",
    ];
    const hasConfig = (
      await Promise.all(
        configCandidates.map((file) => pathExists(path.join(projectDir, file)))
      )
    ).some(Boolean);

    if (!hasConfig) {
      failures.push("commitlint.config.mjs missing");
    }
  }

  if (failures.length > 0) {
    return {
      name: "Husky / Commitlint",
      status: "failed",
      message: failures.join("; "),
    };
  }

  return {
    name: "Husky / Commitlint",
    status: "passed",
    message: "Husky hooks and Commitlint configuration verified",
  };
}

/**
 * Verifies Git repository initialization.
 */
export async function verifyGitIntegration(
  projectDir: string,
  enabled: boolean
): Promise<CheckResult> {
  const hasGit = await pathExists(path.join(projectDir, ".git"));

  if (enabled) {
    if (!hasGit) {
      return {
        name: "Git Repository",
        status: "failed",
        message: ".git repository directory missing",
      };
    }
    return {
      name: "Git Repository",
      status: "passed",
      message: "Git repository initialized",
    };
  }

  // Not enabled / skipped by generator
  return {
    name: "Git Repository",
    status: "skipped",
    message: hasGit
      ? "Git repository initialized by upstream generator"
      : "Git initialization skipped by default framework template",
  };
}
