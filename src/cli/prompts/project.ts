import { checkbox, confirm, input, select } from "@inquirer/prompts";

import {
  normalizeProjectName,
  validateExistingConfig,
  validateProjectName,
} from "../../core/engine/validate.js";
import {
  getCategories,
  getFramework,
  getFrameworkChoices,
} from "../../core/registry/framework.js";
import type {
  AuthProvider,
  DatabaseType,
  FrameworkCategory,
  GeneratorOptions,
  PackageManager,
  PartialProjectConfig,
  ToolType,
} from "../../core/types/config.js";
import type { FrameworkType } from "../../core/types/framework.js";

const authProviderNames: Record<AuthProvider, string> = {
  "better-auth": "Better Auth",
  authjs: "Auth.js",
  clerk: "Clerk",
};

export const promptProjectConfig = async (
  existing: PartialProjectConfig = {}
): Promise<GeneratorOptions> => {
  // Step 1: Project name
  const rawProjectName =
    existing.projectName ??
    (await input({
      message: "What is your project name?",
      default: "my-app",
      validate: validateProjectName,
    }));

  const projectName = normalizeProjectName(rawProjectName);
  const nameValidation = validateProjectName(projectName);
  if (nameValidation !== true) {
    throw new Error(nameValidation);
  }

  // Step 2 & 3: Framework (Category + Framework)
  let framework: FrameworkType;

  if (existing.framework) {
    framework = existing.framework;
  } else {
    const category = await select<FrameworkCategory>({
      message: "Select project category",
      choices: getCategories().map((cat) => ({
        name: `${cat.name.padEnd(12)} - ${cat.description}`,
        value: cat.value,
      })),
      default: "fullstack",
    });

    framework = await select<FrameworkType>({
      message: "Choose a framework",
      choices: getFrameworkChoices(category).map((f) => ({
        name: f.name,
        value: f.value,
      })),
    });
  }

  const frameworkInfo = getFramework(framework);
  const capabilities = frameworkInfo.capabilities;

  // Validate any existing flags before prompting remaining questions
  validateExistingConfig(existing, framework);

  // Step 4: Language (TypeScript vs JavaScript)
  let typeScript: boolean;

  if (existing.typeScript !== undefined) {
    typeScript = existing.typeScript;
  } else if (capabilities.typescript && capabilities.javascript) {
    typeScript = await confirm({
      message: "Use TypeScript?",
      default: true,
    });
  } else {
    // Only one language supported (e.g. Angular is TypeScript only)
    typeScript = capabilities.typescript;
  }

  // Step 5: Database (only if supported by framework)
  let database: DatabaseType = "none";

  if (capabilities.databases.length > 0) {
    if (existing.database !== undefined) {
      database = existing.database;
    } else {
      const choices: { name: string; value: DatabaseType }[] =
        capabilities.databases.map((db) => {
          if (db === "postgres") {
            return { name: "PostgreSQL (Prisma)", value: "postgres" };
          }
          return { name: "MongoDB (Mongoose)", value: "mongodb" };
        });
      choices.push({ name: "None", value: "none" });

      database = await select<DatabaseType>({
        message: "Choose a database",
        choices,
        default: "none",
      });
    }
  }

  // Step 6: Authentication (only if supported by framework)
  let auth: GeneratorOptions["auth"] = false;

  const availableAuthProviders = capabilities.authProviders;

  if (availableAuthProviders.length > 0) {
    if (existing.auth !== undefined) {
      auth = existing.auth;
    } else {
      const wantsAuth = await confirm({
        message: "Add authentication?",
        default: false,
      });

      if (wantsAuth) {
        if (availableAuthProviders.length === 1) {
          auth = availableAuthProviders[0];
        } else {
          auth = await select<AuthProvider>({
            message: "Choose an authentication provider",
            choices: availableAuthProviders.map((provider) => ({
              name: authProviderNames[provider] ?? provider,
              value: provider,
            })),
          });
        }
      }
    }
  }

  // Step 7: Styling (Tailwind CSS)
  let tailwind = false;
  if (capabilities.styling.includes("tailwind")) {
    if (existing.tailwind !== undefined) {
      tailwind = existing.tailwind;
    } else {
      tailwind = await confirm({
        message: "Use Tailwind CSS?",
        default: true,
      });
    }
  }

  // Step 8: UI Library (only if supported by framework and Tailwind is enabled)
  let uiLibrary: GeneratorOptions["uiLibrary"] = false;

  if (capabilities.shadcn && tailwind) {
    if (existing.uiLibrary !== undefined) {
      uiLibrary = existing.uiLibrary;
    } else {
      const wantsShadcn = await confirm({
        message: "Add shadcn/ui?",
        default: false,
      });
      uiLibrary = wantsShadcn ? "shadcn" : false;
    }
  }

  // Step 9: Development Tools (filtered to framework capabilities)
  let tools: ToolType[];

  if (existing.tools !== undefined) {
    tools = existing.tools;
  } else {
    const toolChoices: { name: string; value: ToolType; checked?: boolean }[] =
      [];

    if (capabilities.tools.includes("eslint")) {
      toolChoices.push({ name: "ESLint", value: "eslint", checked: true });
    }
    if (capabilities.tools.includes("prettier")) {
      toolChoices.push({ name: "Prettier", value: "prettier", checked: true });
    }
    if (capabilities.tools.includes("husky")) {
      toolChoices.push({ name: "Husky (Git hooks)", value: "husky" });
    }
    if (capabilities.tools.includes("commitlint")) {
      toolChoices.push({
        name: "Commitlint (Conventional commits)",
        value: "commitlint",
      });
    }

    if (toolChoices.length > 0) {
      tools = await checkbox<ToolType>({
        message: "Which development tools do you want?",
        choices: toolChoices,
      });
    } else {
      tools = [];
    }
  }

  // Step 10: Package Manager (filtered to framework capabilities)
  let packageManager: PackageManager;

  if (existing.packageManager !== undefined) {
    packageManager = existing.packageManager;
  } else {
    const pmChoices = capabilities.packageManagers.map((pm) => ({
      name: pm === "yarn" ? "Yarn" : pm === "bun" ? "Bun" : pm,
      value: pm as PackageManager,
    }));

    packageManager = await select<PackageManager>({
      message: "Choose a package manager",
      choices: pmChoices,
      default: (capabilities.packageManagers.includes("npm")
        ? "npm"
        : capabilities.packageManagers[0]) as PackageManager,
    });
  }

  return {
    projectName,
    framework,
    typeScript,
    database,
    auth,
    tailwind,
    uiLibrary,
    tools,
    packageManager,
  };
};
