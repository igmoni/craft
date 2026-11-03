import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { configureAuth } from "../dist/generators/auth.js";
import { configureDatabase } from "../dist/generators/database.js";
import { generateEnvFile } from "../dist/generators/env.js";
import { configureTailwind } from "../dist/generators/tailwind.js";
import { configureTools } from "../dist/generators/tools.js";
import {
  createStagingDirectory,
  mergeStagedFiles,
} from "../dist/services/staging.js";
import { pathExists } from "../dist/utils/error.js";

describe("Integrations & File Operations", () => {
  const createTempDir = async () => {
    return fs.mkdtemp(path.join(os.tmpdir(), "craft-test-"));
  };

  describe("Staging and Merging", () => {
    it("should safely merge staged files into target directory", async () => {
      const stagingRoot = await createStagingDirectory();
      const targetDir = await createTempDir();

      const stagedDir = path.join(stagingRoot, "app");
      await fs.mkdir(path.join(stagedDir, "src"), { recursive: true });
      await fs.writeFile(
        path.join(stagedDir, "package.json"),
        '{"name":"app"}'
      );
      await fs.writeFile(
        path.join(stagedDir, "src", "index.ts"),
        'console.log("hello");'
      );

      await mergeStagedFiles(stagedDir, targetDir);

      assert.ok(await pathExists(path.join(targetDir, "package.json")));
      assert.ok(await pathExists(path.join(targetDir, "src", "index.ts")));

      // Clean up
      await fs.rm(stagingRoot, { recursive: true, force: true });
      await fs.rm(targetDir, { recursive: true, force: true });
    });
  });

  describe("Database Integration", () => {
    it("should configure PostgreSQL with Prisma in TypeScript", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      await configureDatabase(
        {
          projectName: "db-app",
          framework: "express",
          typeScript: true,
          database: "postgres",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.ok(pkg.dependencies["@prisma/client"]);
      assert.ok(pkg.devDependencies["prisma"]);
      assert.equal(pkg.scripts["db:generate"], "prisma generate");

      const schemaPath = path.join(dir, "prisma", "schema.prisma");
      assert.ok(await pathExists(schemaPath));
      const schema = await fs.readFile(schemaPath, "utf8");
      assert.ok(schema.includes('provider = "postgresql"'));
      assert.ok(schema.includes('url      = env("DATABASE_URL")'));

      const dbFile = path.join(dir, "src", "db.ts");
      assert.ok(await pathExists(dbFile));
      const dbContent = await fs.readFile(dbFile, "utf8");
      assert.ok(dbContent.includes("new PrismaClient"));

      const envExample = await fs.readFile(
        path.join(dir, ".env.example"),
        "utf8"
      );
      assert.ok(envExample.includes("DATABASE_URL="));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should configure PostgreSQL with Prisma in JavaScript without TS syntax", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      await configureDatabase(
        {
          projectName: "db-js-app",
          framework: "express",
          typeScript: false,
          database: "postgres",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const dbFile = path.join(dir, "src", "db.js");
      assert.ok(await pathExists(dbFile));
      const dbContent = await fs.readFile(dbFile, "utf8");
      assert.ok(!dbContent.includes(": Promise<void>"));
      assert.ok(!dbContent.includes("as unknown as"));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should configure MongoDB with Mongoose", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      await configureDatabase(
        {
          projectName: "mongo-app",
          framework: "express",
          typeScript: true,
          database: "mongodb",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.ok(pkg.dependencies["mongoose"]);

      const dbFile = path.join(dir, "src", "db.ts");
      assert.ok(await pathExists(dbFile));
      const dbContent = await fs.readFile(dbFile, "utf8");
      assert.ok(dbContent.includes("mongoose.connect"));

      const envExample = await fs.readFile(
        path.join(dir, ".env.example"),
        "utf8"
      );
      assert.ok(envExample.includes("MONGODB_URI="));

      await fs.rm(dir, { recursive: true, force: true });
    });
  });

  describe("Authentication Integration", () => {
    it("should configure Next.js with Better Auth and generate handlers", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      await configureAuth(
        {
          projectName: "next-auth-app",
          framework: "next",
          typeScript: true,
          database: "none",
          auth: "better-auth",
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.ok(pkg.dependencies["better-auth"]);

      assert.ok(await pathExists(path.join(dir, "lib", "auth.ts")));
      assert.ok(await pathExists(path.join(dir, "lib", "auth-client.ts")));
      assert.ok(
        await pathExists(
          path.join(dir, "app", "api", "auth", "[...all]", "route.ts")
        )
      );
      assert.ok(await pathExists(path.join(dir, "AUTH_SETUP.md")));

      const envExample = await fs.readFile(
        path.join(dir, ".env.example"),
        "utf8"
      );
      assert.ok(envExample.includes("BETTER_AUTH_SECRET="));
      assert.ok(envExample.includes("BETTER_AUTH_URL="));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should configure Next.js with Auth.js and generate handlers and middleware", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      await configureAuth(
        {
          projectName: "next-authjs-app",
          framework: "next",
          typeScript: true,
          database: "none",
          auth: "authjs",
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      assert.ok(await pathExists(path.join(dir, "auth.ts")));
      assert.ok(
        await pathExists(
          path.join(dir, "app", "api", "auth", "[...nextauth]", "route.ts")
        )
      );
      assert.ok(await pathExists(path.join(dir, "middleware.ts")));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should configure React with Clerk and create AuthProvider", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      await configureAuth(
        {
          projectName: "react-clerk-app",
          framework: "react",
          typeScript: true,
          database: "none",
          auth: "clerk",
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.ok(pkg.dependencies["@clerk/clerk-react"]);
      assert.ok(
        await pathExists(
          path.join(dir, "src", "components", "AuthProvider.tsx")
        )
      );

      await fs.rm(dir, { recursive: true, force: true });
    });
  });

  describe("Development Tools Integration", () => {
    it("should configure ESLint, Prettier, Husky, Commitlint", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      await configureTools(
        {
          projectName: "tools-app",
          framework: "react",
          typeScript: true,
          database: "none",
          auth: false,
          tools: ["eslint", "prettier", "husky", "commitlint"],
          packageManager: "npm",
        },
        dir
      );

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.ok(pkg.devDependencies["eslint"]);
      assert.ok(pkg.devDependencies["prettier"]);
      assert.ok(pkg.devDependencies["husky"]);
      assert.ok(pkg.devDependencies["@commitlint/cli"]);
      assert.equal(pkg.scripts["lint"], "eslint .");
      assert.equal(pkg.scripts["format"], "prettier --write .");

      assert.ok(await pathExists(path.join(dir, "eslint.config.mjs")));
      assert.ok(await pathExists(path.join(dir, ".prettierrc.json")));
      assert.ok(await pathExists(path.join(dir, ".prettierignore")));
      assert.ok(await pathExists(path.join(dir, "commitlint.config.mjs")));
      assert.ok(await pathExists(path.join(dir, ".husky", "pre-commit")));
      assert.ok(await pathExists(path.join(dir, ".husky", "commit-msg")));

      await fs.rm(dir, { recursive: true, force: true });
    });
  });

  describe("Tailwind CSS Integration", () => {
    it("should configure Angular with @tailwindcss/postcss", async () => {
      const dir = await createTempDir();
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      await fs.writeFile(path.join(dir, "package.json"), "{}");
      await fs.writeFile(
        path.join(dir, "src", "styles.css"),
        "/* base styles */"
      );

      await configureTailwind(
        {
          projectName: "angular-tw",
          framework: "angular",
          typeScript: true,
          database: "none",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.ok(pkg.devDependencies["@tailwindcss/postcss"]);
      assert.ok(await pathExists(path.join(dir, ".postcssrc.json")));

      const styles = await fs.readFile(
        path.join(dir, "src", "styles.css"),
        "utf8"
      );
      assert.ok(styles.includes('@import "tailwindcss";'));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should configure React (Vite) with @tailwindcss/vite", async () => {
      const dir = await createTempDir();
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      await fs.writeFile(path.join(dir, "package.json"), "{}");
      await fs.writeFile(
        path.join(dir, "vite.config.ts"),
        'import { defineConfig } from "vite";\nexport default defineConfig({ plugins: [] });'
      );
      await fs.writeFile(
        path.join(dir, "src", "index.css"),
        "body { margin: 0; }"
      );

      await configureTailwind(
        {
          projectName: "react-tw",
          framework: "react",
          typeScript: true,
          database: "none",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const viteConfig = await fs.readFile(
        path.join(dir, "vite.config.ts"),
        "utf8"
      );
      assert.ok(viteConfig.includes("@tailwindcss/vite"));
      assert.ok(viteConfig.includes("tailwindcss()"));

      const css = await fs.readFile(path.join(dir, "src", "index.css"), "utf8");
      assert.ok(css.includes('@import "tailwindcss";'));

      await fs.rm(dir, { recursive: true, force: true });
    });
  });

  describe("Environment File Generation", () => {
    it("should copy .env.example to .env without overwriting existing .env", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, ".env.example"), "KEY=VALUE\n");

      const created = await generateEnvFile(dir);
      assert.equal(created, true);
      assert.ok(await pathExists(path.join(dir, ".env")));

      // Calling again when .env exists should not overwrite
      await fs.writeFile(path.join(dir, ".env"), "KEY=CUSTOM\n");
      const createdSecondTime = await generateEnvFile(dir);
      assert.equal(createdSecondTime, false);
      const content = await fs.readFile(path.join(dir, ".env"), "utf8");
      assert.equal(content, "KEY=CUSTOM\n");

      await fs.rm(dir, { recursive: true, force: true });
    });
  });
});
