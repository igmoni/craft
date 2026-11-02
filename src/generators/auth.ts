import fs from "node:fs/promises";
import path from "node:path";

import { getFramework } from "../core/registry/framework.js";
import type { GenerateProjectConfig } from "../core/types/config.js";
import type { AuthProvider } from "../core/types/framework.js";

type PackageJson = {
  dependencies?: Record<string, string>;
};

function getPackageName(
  provider: AuthProvider,
  framework: GenerateProjectConfig["framework"]
): string {
  if (provider === "better-auth") return "better-auth";
  if (provider === "authjs") return "next-auth";

  if (framework === "next") return "@clerk/nextjs";
  if (framework === "react") return "@clerk/clerk-react";

  return "@clerk/express";
}

function getEnvVars(
  provider: AuthProvider,
  framework: GenerateProjectConfig["framework"]
): string[] {
  if (provider === "better-auth") {
    return [
      "BETTER_AUTH_SECRET=replace-with-a-secure-random-secret",
      "BETTER_AUTH_URL=http://localhost:3000",
    ];
  }

  if (provider === "authjs") {
    return ["AUTH_SECRET=replace-with-a-secure-random-secret"];
  }

  const publishableKey =
    framework === "next"
      ? "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
      : framework === "react"
        ? "VITE_CLERK_PUBLISHABLE_KEY"
        : "CLERK_PUBLISHABLE_KEY";

  return [
    `${publishableKey}=replace-with-your-publishable-key`,
    "CLERK_SECRET_KEY=replace-with-your-secret-key",
  ];
}

export async function configureAuth(
  config: GenerateProjectConfig,
  projectDir: string
): Promise<void> {
  if (!config.auth) return;

  const provider = config.auth;
  const framework = getFramework(config.framework);

  const supportedProviders: readonly AuthProvider[] =
    framework.capabilities.authProviders;

  if (!supportedProviders.includes(provider)) {
    throw new Error(`${provider} is not supported for ${framework.name}.`);
  }

  const packageName = getPackageName(provider, config.framework);

  const packagePath = path.join(projectDir, "package.json");

  const packageJson = JSON.parse(
    await fs.readFile(packagePath, "utf8")
  ) as PackageJson;

  packageJson.dependencies ??= {};
  packageJson.dependencies[packageName] ??= "latest";

  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const envPath = path.join(projectDir, ".env.example");
  const existingEnv = await fs.readFile(envPath, "utf8").catch(() => "");

  const existingKeys = new Set(
    existingEnv.split(/\r?\n/).map((line) => line.split("=")[0])
  );

  const missingVars = getEnvVars(provider, config.framework).filter(
    (entry) => !existingKeys.has(entry.split("=")[0])
  );

  if (missingVars.length > 0) {
    const separator = existingEnv && !existingEnv.endsWith("\n") ? "\n" : "";

    await fs.writeFile(
      envPath,
      `${existingEnv}${separator}${missingVars.join("\n")}\n`
    );
  }

  const documentation: Record<AuthProvider, string> = {
    "better-auth": "https://www.better-auth.com/docs",
    authjs: "https://authjs.dev/",
    clerk: "https://clerk.com/docs",
  };

  const instructionsPath = path.join(projectDir, "AUTH_SETUP.md");

  await fs.writeFile(
    instructionsPath,
    `# Authentication setup

Provider: ${provider}
Framework: ${config.framework}

## Required steps

1. Install dependencies using your selected package manager.
2. Create your provider account if required.
3. Configure the environment variables listed in \`.env.example\`.
4. Follow the provider's official framework integration guide.
5. Configure callbacks, middleware, routes, and session handling as required.
6. Test registration, sign-in, sign-out, and protected routes before deployment.

Craft installs the provider package but does not automatically complete
provider-specific application wiring or account setup.

## Official documentation

${documentation[provider]}
`
  );
}
