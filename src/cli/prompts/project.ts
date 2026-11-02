import { checkbox, confirm, input, select } from "@inquirer/prompts";

import { getFramework } from "../../core/registry/framework.js";
import type {
  DatabaseType,
  GeneratorOptions,
  PartialProjectConfig,
  ToolType,
} from "../../core/types/config.js";
import type { AuthProvider } from "../../core/types/config.js";

const authProviders: Record<
  AuthProvider,
  Partial<Record<GeneratorOptions["framework"], string>>
> = {
  "better-auth": {
    next: "Better Auth",
    react: "Better Auth",
    express: "Better Auth",
  },
  authjs: {
    next: "Auth.js",
  },
  clerk: {
    next: "Clerk",
    react: "Clerk",
    express: "Clerk",
  },
};

export const promptProjectConfig = async (
  existing: PartialProjectConfig = {}
): Promise<GeneratorOptions> => {
  const projectName =
    existing.projectName ??
    (
      await input({
        message: "What is your project name?",
        validate: (value) => {
          const name = value.trim();

          if (!name) return "Project name is required.";

          if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
            return "Use only letters, numbers, hyphens, and underscores.";
          }

          return true;
        },
      })
    )
      .trim()
      .toLowerCase();

  const framework =
    existing.framework ??
    (await select({
      message: "Choose a framework",
      choices: [
        { name: "Angular", value: "angular" },
        { name: "Vue", value: "vue" },
        { name: "React (Vite)", value: "react" },
        { name: "NestJS", value: "nestjs" },
        { name: "Express", value: "express" },
        { name: "Fastify", value: "fastify" },
        { name: "Hono", value: "hono" },
        { name: "Next.js", value: "next" },
      ],
    }));

  const frameworkInfo = getFramework(framework);
  const capabilities = frameworkInfo.capabilities;

  let typeScript: boolean;

  if (existing.typeScript !== undefined) {
    typeScript = existing.typeScript;
  } else if (capabilities.typescript && capabilities.javascript) {
    typeScript = await confirm({
      message: "Use TypeScript?",
      default: true,
    });
  } else {
    typeScript = capabilities.typescript;
  }

  let database: DatabaseType = "none";

  if (capabilities.database) {
    database =
      existing.database ??
      (await select({
        message: "Choose a database",
        choices: [
          { name: "PostgreSQL", value: "postgres" },
          { name: "MongoDB", value: "mongodb" },
          { name: "None", value: "none" },
        ],
      }));
  } else if (existing.database !== undefined && existing.database !== "none") {
    throw new Error(
      `${frameworkInfo.name} does not support Craft database integration.`
    );
  }

  const availableAuthProviders = capabilities.authProviders;

  let auth: GeneratorOptions["auth"] = false;

  if (availableAuthProviders.length > 0) {
    const wantsAuth =
      existing.auth !== undefined
        ? existing.auth !== false
        : await confirm({
            message: "Add authentication?",
            default: false,
          });

    if (wantsAuth) {
      auth =
        existing.auth !== undefined
          ? existing.auth
          : await select({
              message: "Choose an authentication provider",
              choices: availableAuthProviders.map((provider) => ({
                name: provider,
                value: provider,
              })),
            });
    }
  }

  const uiLibrary = capabilities.shadcn
    ? existing.uiLibrary !== undefined
      ? existing.uiLibrary
      : (await confirm({
            message: "Add shadcn/ui?",
            default: false,
          }))
        ? "shadcn"
        : false
    : false;

  const tools: ToolType[] =
    existing.tools ??
    (await checkbox({
      message: "Which tools do you want?",
      choices: [
        { name: "ESLint", value: "eslint", checked: true },
        { name: "Prettier", value: "prettier", checked: true },
        { name: "Husky", value: "husky" },
        { name: "Commitlint", value: "commitlint" },
      ],
    }));

  const packageManager =
    existing.packageManager ??
    (await select({
      message: "Choose a package manager",
      choices: [
        { name: "npm", value: "npm" },
        { name: "pnpm", value: "pnpm" },
        { name: "Yarn", value: "yarn" },
        { name: "Bun", value: "bun" },
      ],
      default: "npm",
    }));

  return {
    projectName,
    framework,
    typeScript,
    database,
    auth,
    uiLibrary,
    tools,
    packageManager,
  };
};
