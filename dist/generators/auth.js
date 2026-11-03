import fs from "node:fs/promises";
import path from "node:path";
import { getFramework } from "../core/registry/framework.js";
import { pathExists } from "../utils/error.js";
function getAuthPackages(provider, framework) {
    if (provider === "better-auth") {
        return [{ name: "better-auth", version: "latest" }];
    }
    if (provider === "authjs") {
        return [{ name: "next-auth", version: "latest" }];
    }
    if (provider === "clerk") {
        if (framework === "next") {
            return [{ name: "@clerk/nextjs", version: "latest" }];
        }
        if (framework === "react") {
            return [{ name: "@clerk/clerk-react", version: "latest" }];
        }
        if (framework === "express") {
            return [{ name: "@clerk/express", version: "latest" }];
        }
    }
    throw new Error(`Provider "${provider}" is not supported for framework "${framework}".`);
}
function getEnvironmentVariables(provider, framework) {
    if (provider === "better-auth") {
        if (framework === "react") {
            return [
                {
                    key: "VITE_BETTER_AUTH_URL",
                    value: "http://localhost:3000",
                },
            ];
        }
        return [
            {
                key: "BETTER_AUTH_SECRET",
                value: "replace-with-a-secure-random-secret",
            },
            {
                key: "BETTER_AUTH_URL",
                value: "http://localhost:3000",
            },
        ];
    }
    if (provider === "authjs") {
        return [
            {
                key: "AUTH_SECRET",
                value: "replace-with-a-secure-random-secret",
            },
        ];
    }
    if (provider === "clerk") {
        if (framework === "react") {
            return [
                {
                    key: "VITE_CLERK_PUBLISHABLE_KEY",
                    value: "pk_test_replace_with_your_publishable_key",
                },
            ];
        }
        if (framework === "next") {
            return [
                {
                    key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
                    value: "pk_test_replace_with_your_publishable_key",
                },
                {
                    key: "CLERK_SECRET_KEY",
                    value: "sk_test_replace_with_your_secret_key",
                },
            ];
        }
        return [
            {
                key: "CLERK_PUBLISHABLE_KEY",
                value: "pk_test_replace_with_your_publishable_key",
            },
            {
                key: "CLERK_SECRET_KEY",
                value: "sk_test_replace_with_your_secret_key",
            },
        ];
    }
    return [];
}
async function addEnvironmentVariables(projectDir, variables) {
    const envPath = path.join(projectDir, ".env.example");
    let content = "";
    if (await pathExists(envPath)) {
        content = await fs.readFile(envPath, "utf8");
    }
    const existingKeys = new Set(content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("=")[0].trim()));
    const missingVariables = variables
        .filter(({ key }) => !existingKeys.has(key))
        .map(({ key, value }) => `${key}="${value}"`);
    if (missingVariables.length === 0)
        return;
    const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
    await fs.writeFile(envPath, `${content}${separator}${missingVariables.join("\n")}\n`);
}
async function writeFile(filePath, content) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, { encoding: "utf8" });
}
async function generateNextAuthFiles(projectDir, isTS) {
    const hasSrcDir = await pathExists(path.join(projectDir, "src"));
    const baseDir = hasSrcDir ? path.join(projectDir, "src") : projectDir;
    const ext = isTS ? "ts" : "js";
    // auth config
    const authConfigContent = isTS
        ? `import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
  secret: process.env.AUTH_SECRET,
});
`
        : `import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
  secret: process.env.AUTH_SECRET,
});
`;
    await writeFile(path.join(baseDir, `auth.${ext}`), authConfigContent);
    // route handler: app/api/auth/[...nextauth]/route.ts
    const routeDir = path.join(baseDir, "app", "api", "auth", "[...nextauth]");
    const routeContent = isTS
        ? `import { handlers } from "@/auth";

export const { GET, POST } = handlers;
`
        : `import { handlers } from "@/auth";

export const { GET, POST } = handlers;
`;
    await writeFile(path.join(routeDir, `route.${ext}`), routeContent);
    // middleware: middleware.ts
    const middlewareContent = isTS
        ? `export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
`
        : `export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
`;
    await writeFile(path.join(baseDir, `middleware.${ext}`), middlewareContent);
}
async function generateNextBetterAuthFiles(projectDir, isTS) {
    const hasSrcDir = await pathExists(path.join(projectDir, "src"));
    const baseDir = hasSrcDir ? path.join(projectDir, "src") : projectDir;
    const ext = isTS ? "ts" : "js";
    // server auth
    const serverAuthContent = isTS
        ? `import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
`
        : `import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
`;
    await writeFile(path.join(baseDir, "lib", `auth.${ext}`), serverAuthContent);
    // client auth
    const clientAuthContent = isTS
        ? `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
`
        : `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
`;
    await writeFile(path.join(baseDir, "lib", `auth-client.${ext}`), clientAuthContent);
    // route handler: app/api/auth/[...all]/route.ts
    const routeDir = path.join(baseDir, "app", "api", "auth", "[...all]");
    const routeContent = isTS
        ? `import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
`
        : `import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
`;
    await writeFile(path.join(routeDir, `route.${ext}`), routeContent);
}
async function generateNextClerkFiles(projectDir, isTS) {
    const hasSrcDir = await pathExists(path.join(projectDir, "src"));
    const baseDir = hasSrcDir ? path.join(projectDir, "src") : projectDir;
    const ext = isTS ? "ts" : "js";
    const middlewareContent = isTS
        ? `import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
`
        : `import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
`;
    await writeFile(path.join(baseDir, `middleware.${ext}`), middlewareContent);
}
async function generateReactBetterAuthFiles(projectDir, isTS) {
    const ext = isTS ? "ts" : "js";
    const clientAuthContent = isTS
        ? `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
`
        : `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
`;
    await writeFile(path.join(projectDir, "src", "lib", `auth-client.${ext}`), clientAuthContent);
}
async function generateReactClerkFiles(projectDir, isTS) {
    const ext = isTS ? "tsx" : "jsx";
    const providerContent = isTS
        ? `import React from "react";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!PUBLISHABLE_KEY) {
    console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || ""}>
      {children}
    </ClerkProvider>
  );
}
`
        : `import React from "react";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AuthProvider({ children }) {
  if (!PUBLISHABLE_KEY) {
    console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || ""}>
      {children}
    </ClerkProvider>
  );
}
`;
    await writeFile(path.join(projectDir, "src", "components", `AuthProvider.${ext}`), providerContent);
}
async function generateExpressBetterAuthFiles(projectDir, isTS) {
    const ext = isTS ? "ts" : "js";
    const authServerContent = isTS
        ? `import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
`
        : `import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
`;
    await writeFile(path.join(projectDir, "src", `auth.${ext}`), authServerContent);
}
function getSetupInstructions(provider, framework) {
    const header = `# Authentication Setup Guide (${provider.toUpperCase()})

Framework: ${framework}
Provider: ${provider}

## What Craft Configured

- Installed authentication package in \`package.json\`.
- Added required environment variables to \`.env.example\` and local \`.env\`.
- Created framework-specific configuration files and handlers:
`;
    if (provider === "better-auth") {
        if (framework === "next") {
            return `${header}  - \`src/lib/auth.ts\`: Server-side Better Auth instance
  - \`src/lib/auth-client.ts\`: Client-side React auth client (\`signIn\`, \`signUp\`, \`signOut\`, \`useSession\`)
  - \`src/app/api/auth/[...all]/route.ts\`: Next.js App Router API route handler

## Next Steps

1. Configure \`BETTER_AUTH_SECRET\` in \`.env\`:
   \`\`\`bash
   # Generate a 32-byte secure key
   openssl rand -base64 32
   \`\`\`
2. Set \`BETTER_AUTH_URL\` to \`http://localhost:3000\` (or your production domain).
3. If using Prisma, configure Better Auth Prisma adapter in \`src/lib/auth.ts\`.
4. Run \`npm run dev\` and use \`authClient\` in your React client components.

Official documentation: https://better-auth.com/docs/installation
`;
        }
        if (framework === "react") {
            return `${header}  - \`src/lib/auth-client.ts\`: Client-side React auth client

## Next Steps

1. Ensure your backend server (e.g. Express or Next.js) is running Better Auth.
2. Set \`VITE_BETTER_AUTH_URL\` in \`.env\` to point to your backend server URL.
3. Import and use \`authClient\` in your React components:
   \`\`\`tsx
   import { authClient } from "./lib/auth-client";
   const { data: session } = authClient.useSession();
   \`\`\`

Official documentation: https://better-auth.com/docs/installation
`;
        }
        if (framework === "express") {
            return `${header}  - \`src/auth.ts\`: Server-side Better Auth instance
  - \`src/index.ts\`: Mounted \`toNodeHandler(auth)\` BEFORE \`express.json()\`

## Next Steps

1. Configure \`BETTER_AUTH_SECRET\` in \`.env\`.
2. Set \`BETTER_AUTH_URL\` to \`http://localhost:3000\`.
3. If connecting to a database, configure the adapter in \`src/auth.ts\`.
4. Start your server with \`npm run dev\`.

Official documentation: https://better-auth.com/docs/installation
`;
        }
    }
    if (provider === "authjs") {
        return `${header}  - \`src/auth.ts\`: NextAuth initialization and handler exports
  - \`src/app/api/auth/[...nextauth]/route.ts\`: App router route handler
  - \`src/middleware.ts\`: Session middleware protecting routes

## Next Steps

1. Generate a secure secret for \`AUTH_SECRET\` in \`.env\`:
   \`\`\`bash
   npx auth secret
   \`\`\`
2. Add your desired providers (GitHub, Google, Credentials) in \`src/auth.ts\`.
3. For OAuth providers, obtain Client ID and Client Secret from provider developer portals:
   \`AUTH_GITHUB_ID=...\`
   \`AUTH_GITHUB_SECRET=...\`
4. Start your application with \`npm run dev\`.

Official documentation: https://authjs.dev/getting-started/installation
`;
    }
    if (provider === "clerk") {
        if (framework === "next") {
            return `${header}  - \`src/middleware.ts\`: Clerk middleware protecting application routes

## Next Steps

1. Sign in to your Clerk Dashboard: https://dashboard.clerk.com
2. Create an application and copy your API Keys.
3. Add to \`.env\`:
   - \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\`
   - \`CLERK_SECRET_KEY\`
4. Wrap your root layout (\`src/app/layout.tsx\`) with \`<ClerkProvider>\`:
   \`\`\`tsx
   import { ClerkProvider } from "@clerk/nextjs";
   export default function RootLayout({ children }) {
     return <ClerkProvider><html><body>{children}</body></html></ClerkProvider>;
   }
   \`\`\`
5. Start developing with Clerk components (\`<SignInButton>\`, \`<UserButton>\`).

Official documentation: https://clerk.com/docs/quickstarts/nextjs
`;
        }
        if (framework === "react") {
            return `${header}  - \`src/components/AuthProvider.tsx\`: ClerkProvider wrapper component

## Next Steps

1. Sign in to your Clerk Dashboard: https://dashboard.clerk.com
2. Copy your Publishable Key into \`.env\` as \`VITE_CLERK_PUBLISHABLE_KEY\`.
3. Wrap your root \`App\` in \`src/main.tsx\` with \`<AuthProvider>\`:
   \`\`\`tsx
   import { AuthProvider } from "./components/AuthProvider";
   <AuthProvider><App /></AuthProvider>
   \`\`\`

Official documentation: https://clerk.com/docs/quickstarts/react
`;
        }
        if (framework === "express") {
            return `${header}  - Integrated \`clerkMiddleware()\` in \`src/index.ts\`

## Next Steps

1. Add your keys to \`.env\`:
   - \`CLERK_PUBLISHABLE_KEY\`
   - \`CLERK_SECRET_KEY\`
2. Protect endpoints using \`getAuth(req)\`:
   \`\`\`ts
   import { getAuth } from "@clerk/express";
   app.get("/api/protected", (req, res) => {
     const auth = getAuth(req);
     if (!auth.userId) return res.status(401).send("Unauthorized");
     res.json({ userId: auth.userId });
   });
   \`\`\`

Official documentation: https://clerk.com/docs/quickstarts/express
`;
        }
    }
    return header;
}
export async function configureAuth(config, projectDir) {
    if (!config.auth)
        return;
    const provider = config.auth;
    const frameworkDef = getFramework(config.framework);
    if (!frameworkDef.capabilities.authProviders.includes(provider)) {
        throw new Error(`"${provider}" authentication is not supported for ${frameworkDef.name}.`);
    }
    // Add dependencies
    const packages = getAuthPackages(provider, config.framework);
    const packagePath = path.join(projectDir, "package.json");
    let packageJson = {};
    if (await pathExists(packagePath)) {
        packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));
    }
    packageJson.dependencies ??= {};
    for (const pkg of packages) {
        packageJson.dependencies[pkg.name] = pkg.version;
    }
    await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    // Add env vars
    const envVars = getEnvironmentVariables(provider, config.framework);
    await addEnvironmentVariables(projectDir, envVars);
    // Generate framework-specific integration files
    const isTS = config.typeScript;
    if (config.framework === "next") {
        if (provider === "better-auth") {
            await generateNextBetterAuthFiles(projectDir, isTS);
        }
        else if (provider === "authjs") {
            await generateNextAuthFiles(projectDir, isTS);
        }
        else if (provider === "clerk") {
            await generateNextClerkFiles(projectDir, isTS);
        }
    }
    else if (config.framework === "react") {
        if (provider === "better-auth") {
            await generateReactBetterAuthFiles(projectDir, isTS);
        }
        else if (provider === "clerk") {
            await generateReactClerkFiles(projectDir, isTS);
        }
    }
    else if (config.framework === "express") {
        if (provider === "better-auth") {
            await generateExpressBetterAuthFiles(projectDir, isTS);
        }
    }
    // Write AUTH_SETUP.md
    const instructionsPath = path.join(projectDir, "AUTH_SETUP.md");
    await fs.writeFile(instructionsPath, getSetupInstructions(provider, config.framework), "utf8");
}
//# sourceMappingURL=auth.js.map