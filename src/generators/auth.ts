import fs from "node:fs/promises";
import path from "node:path";
import type { AuthProvider, GenerateProjectConfig } from "../types/utils.js";

type PackageJson = {
  dependencies?: Record<string, string>;
};

const packages: Record<
  AuthProvider,
  Partial<Record<GenerateProjectConfig["framework"], string>>
> = {
  "better-auth": {
    next: "better-auth",
    vite: "better-auth",
    express: "better-auth",
  },
  authjs: {
    next: "next-auth",
  },
  clerk: {
    next: "@clerk/nextjs",
    vite: "@clerk/clerk-react",
    express: "@clerk/express",
  },
};

const envVars: Record<AuthProvider, string[]> = {
  "better-auth": [
    "BETTER_AUTH_SECRET=replace-with-a-secure-random-secret",
    "BETTER_AUTH_URL=http://localhost:3000",
  ],
  authjs: ["AUTH_SECRET=replace-with-a-secure-random-secret"],
  clerk: [
    "VITE_CLERK_PUBLISHABLE_KEY=replace-with-your-publishable-key",
    "CLERK_SECRET_KEY=replace-with-your-secret-key",
  ],
};

export async function configureAuth(
  config: GenerateProjectConfig,
  projectDir: string,
): Promise<void> {
  if (!config.auth) return;

  if (typeof config.auth !== "string") {
    throw new Error(
      "Choose an authentication provider before generating the project.",
    );
  }

  const provider = config.auth as AuthProvider;
  const packageName = packages[provider]?.[config.framework];

  if (!packageName) {
    throw new Error(`${provider} is not configured for ${config.framework}.`);
  }

  const packagePath = path.join(projectDir, "package.json");
  const packageJson = JSON.parse(
    await fs.readFile(packagePath, "utf8"),
  ) as PackageJson;

  packageJson.dependencies ??= {};
  packageJson.dependencies[packageName] ??= "latest";

  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const envPath = path.join(projectDir, ".env.example");
  const existingEnv = await fs.readFile(envPath, "utf8").catch(() => "");
  const existingKeys = new Set(
    existingEnv.split(/\r?\n/).map((line) => line.split("=")[0]),
  );

  const missingVars = envVars[provider].filter(
    (entry) => !existingKeys.has(entry.split("=")[0]),
  );

  if (missingVars.length > 0) {
    const separator = existingEnv && !existingEnv.endsWith("\n") ? "\n" : "";

    await fs.writeFile(
      envPath,
      `${existingEnv}${separator}${missingVars.join("\n")}\n`,
    );
  }

  const instructionsPath = path.join(projectDir, "AUTH_SETUP.md");

  await fs.writeFile(
    instructionsPath,
    `# Authentication setup

Provider: ${provider}
Framework: ${config.framework}

## Required steps

1. Install dependencies with \`npm install\`.
2. Create your provider account if required.
3. Configure the environment variables listed in \`.env.example\`.
4. Follow the provider's official framework integration guide.
5. Configure callbacks, middleware, routes, and session handling as required.
6. Test registration, sign-in, sign-out, and protected routes before deployment.

Craft installs the provider package but does not automatically complete
provider-specific application wiring or account setup.

## Official documentation

${
  provider === "better-auth"
    ? "https://www.better-auth.com/docs"
    : provider === "authjs"
      ? "https://authjs.dev/"
      : "https://clerk.com/docs"
}
`,
  );
}
