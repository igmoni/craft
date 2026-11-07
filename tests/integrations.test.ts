import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { configureAuth } from "../dist/generators/auth.js";
import { expressGenerator } from "../dist/generators/backend/express.js";
import {
  calculatePrismaClientImport,
  configureDatabase,
  getPrismaConfig,
  getPrismaSchema,
  getPrismaSource,
} from "../dist/generators/database.js";
import { generateEnvFile } from "../dist/generators/env.js";
import { configureTailwind } from "../dist/generators/tailwind.js";
import { configureTools } from "../dist/generators/tools.js";
import {
  createStagingDirectory,
  mergeStagedFiles,
  resolveStagingProjectDirectory,
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

    it("should reject merging when staging directory is empty", async () => {
      const stagingRoot = await createStagingDirectory();
      const targetDir = await createTempDir();
      const emptyStagingDir = path.join(stagingRoot, "empty-app");
      await fs.mkdir(emptyStagingDir, { recursive: true });

      await assert.rejects(
        () => mergeStagedFiles(emptyStagingDir, targetDir),
        /Staging directory .* is empty/
      );

      await fs.rm(stagingRoot, { recursive: true, force: true });
      await fs.rm(targetDir, { recursive: true, force: true });
    });

    it("should preserve existing user files when allowExisting is true", async () => {
      const stagingRoot = await createStagingDirectory();
      const targetDir = await createTempDir();

      const stagedDir = path.join(stagingRoot, "app");
      await fs.mkdir(stagedDir, { recursive: true });
      await fs.writeFile(path.join(stagedDir, "file.txt"), "from staging");
      await fs.writeFile(path.join(stagedDir, "new-file.txt"), "new content");

      // Pre-existing user file
      await fs.writeFile(
        path.join(targetDir, "file.txt"),
        "original user content"
      );

      await mergeStagedFiles(stagedDir, targetDir, true);

      // Existing file must be preserved
      assert.equal(
        await fs.readFile(path.join(targetDir, "file.txt"), "utf8"),
        "original user content"
      );
      // New file must be copied
      assert.equal(
        await fs.readFile(path.join(targetDir, "new-file.txt"), "utf8"),
        "new content"
      );

      await fs.rm(stagingRoot, { recursive: true, force: true });
      await fs.rm(targetDir, { recursive: true, force: true });
    });

    it("should resolve staging directory under normal conditions", async () => {
      const stagingRoot = await createStagingDirectory();
      const normalDir = path.join(stagingRoot, "my-app");
      await fs.mkdir(normalDir, { recursive: true });
      await fs.writeFile(path.join(normalDir, "package.json"), "{}");

      const resolved = await resolveStagingProjectDirectory(
        stagingRoot,
        "my-app"
      );
      assert.equal(resolved, normalDir);

      await fs.rm(stagingRoot, { recursive: true, force: true });
    });

    it("should unwrap unnecessary nested project directory", async () => {
      const stagingRoot = await createStagingDirectory();
      const outerDir = path.join(stagingRoot, "my-app");
      const nestedDir = path.join(outerDir, "my-app");
      await fs.mkdir(nestedDir, { recursive: true });
      await fs.writeFile(path.join(nestedDir, "package.json"), "{}");

      const resolved = await resolveStagingProjectDirectory(
        stagingRoot,
        "my-app"
      );
      assert.equal(resolved, nestedDir);

      await fs.rm(stagingRoot, { recursive: true, force: true });
    });

    it("should resolve alternative folder name (e.g. vite-project)", async () => {
      const stagingRoot = await createStagingDirectory();
      const viteDir = path.join(stagingRoot, "vite-project");
      await fs.mkdir(viteDir, { recursive: true });
      await fs.writeFile(path.join(viteDir, "package.json"), "{}");

      const resolved = await resolveStagingProjectDirectory(
        stagingRoot,
        "custom-name"
      );
      assert.equal(resolved, viteDir);

      await fs.rm(stagingRoot, { recursive: true, force: true });
    });

    it("should resolve root directory when files are scaffolded directly into stagingRoot", async () => {
      const stagingRoot = await createStagingDirectory();
      await fs.writeFile(path.join(stagingRoot, "package.json"), "{}");

      const resolved = await resolveStagingProjectDirectory(
        stagingRoot,
        "my-app"
      );
      assert.equal(resolved, stagingRoot);

      await fs.rm(stagingRoot, { recursive: true, force: true });
    });

    it("should throw error when staging directory produced no files", async () => {
      const stagingRoot = await createStagingDirectory();

      await assert.rejects(
        () => resolveStagingProjectDirectory(stagingRoot, "my-app"),
        /No files were generated in staging directory/
      );

      await fs.rm(stagingRoot, { recursive: true, force: true });
    });
  });

  describe("Database Integration", () => {
    it("should configure PostgreSQL with Prisma 7 in TypeScript", async () => {
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
      // Dependencies
      assert.equal(pkg.dependencies["@prisma/client"], "^7.0.0");
      assert.equal(pkg.dependencies["@prisma/adapter-pg"], "^7.0.0");
      assert.equal(pkg.dependencies["pg"], "^8.16.3");
      assert.equal(pkg.dependencies["dotenv"], "^16.4.7");
      assert.equal(pkg.devDependencies["prisma"], "^7.0.0");
      assert.equal(pkg.devDependencies["@types/pg"], "^8.16.0");
      assert.equal(pkg.scripts["db:generate"], "prisma generate");
      assert.equal(pkg.scripts["db:migrate"], "prisma migrate dev");

      // Prisma schema
      const schemaPath = path.join(dir, "prisma", "schema.prisma");
      assert.ok(await pathExists(schemaPath));
      const schema = await fs.readFile(schemaPath, "utf8");
      assert.ok(schema.includes('provider = "prisma-client"'));
      assert.ok(schema.includes('output   = "../src/generated/prisma"'));
      assert.ok(schema.includes('provider = "postgresql"'));
      assert.ok(!schema.includes("url"));
      assert.ok(!schema.includes("prisma-client-js"));

      // Prisma config
      const configPath = path.join(dir, "prisma.config.ts");
      assert.ok(await pathExists(configPath));
      const configSource = await fs.readFile(configPath, "utf8");
      assert.ok(configSource.includes('import "dotenv/config";'));
      assert.ok(
        configSource.includes(
          'import { defineConfig, env } from "prisma/config";'
        )
      );
      assert.ok(configSource.includes('url: env("DATABASE_URL")'));

      // Database client
      const dbFile = path.join(dir, "src", "db.ts");
      assert.ok(await pathExists(dbFile));
      const dbContent = await fs.readFile(dbFile, "utf8");
      assert.ok(
        dbContent.includes('import { PrismaPg } from "@prisma/adapter-pg";')
      );
      assert.ok(
        dbContent.includes(
          'import { PrismaClient } from "./generated/prisma/client";'
        )
      );
      assert.ok(dbContent.includes("new PrismaPg({ connectionString })"));
      assert.ok(dbContent.includes("new PrismaClient"));
      assert.ok(
        dbContent.includes('throw new Error("DATABASE_URL is not defined");')
      );
      assert.ok(dbContent.includes("globalForPrisma"));

      // .env.example
      const envExample = await fs.readFile(
        path.join(dir, ".env.example"),
        "utf8"
      );
      assert.ok(
        envExample.includes(
          'DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"'
        )
      );

      // .gitignore
      const gitignore = await fs.readFile(path.join(dir, ".gitignore"), "utf8");
      assert.ok(gitignore.includes("src/generated"));

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
      assert.ok(!dbContent.includes(": PrismaClient"));
      assert.ok(
        dbContent.includes('import { PrismaPg } from "@prisma/adapter-pg";')
      );
      assert.ok(
        dbContent.includes('throw new Error("DATABASE_URL is not defined");')
      );

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should calculate correct relative client imports across framework directory layouts", () => {
      const projectDir = path.resolve("/workspace/project");

      // Express, Fastify, Hono, NestJS: src/db.ts
      const expressDb = path.join(projectDir, "src", "db.ts");
      assert.equal(
        calculatePrismaClientImport(expressDb, projectDir),
        "./generated/prisma/client"
      );

      // Next.js with src directory: src/lib/db.ts
      const nextSrcDb = path.join(projectDir, "src", "lib", "db.ts");
      assert.equal(
        calculatePrismaClientImport(nextSrcDb, projectDir),
        "../generated/prisma/client"
      );

      // Next.js without src directory: lib/db.ts
      const nextNoSrcDb = path.join(projectDir, "lib", "db.ts");
      assert.equal(
        calculatePrismaClientImport(nextNoSrcDb, projectDir),
        "../src/generated/prisma/client"
      );

      // Root level: db.ts
      const rootDb = path.join(projectDir, "db.ts");
      assert.equal(
        calculatePrismaClientImport(rootDb, projectDir),
        "./src/generated/prisma/client"
      );
    });

    it("should configure Next.js with src/lib/db.ts and global singleton caching", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");
      await fs.mkdir(path.join(dir, "src"), { recursive: true });

      await configureDatabase(
        {
          projectName: "next-db-app",
          framework: "next",
          typeScript: true,
          database: "postgres",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const dbFile = path.join(dir, "src", "lib", "db.ts");
      assert.ok(await pathExists(dbFile));
      const content = await fs.readFile(dbFile, "utf8");
      assert.ok(
        content.includes(
          'import { PrismaClient } from "../generated/prisma/client";'
        )
      );
      assert.ok(content.includes("globalForPrisma.prisma = prisma;"));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should adjust tsconfig.json to exclude prisma.config.ts when rootDir is set", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");
      await fs.writeFile(
        path.join(dir, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            rootDir: "./src",
            outDir: "./dist",
          },
        })
      );

      await configureDatabase(
        {
          projectName: "fastify-app",
          framework: "fastify",
          typeScript: true,
          database: "postgres",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      const tsconfig = JSON.parse(
        await fs.readFile(path.join(dir, "tsconfig.json"), "utf8")
      );
      assert.ok(Array.isArray(tsconfig.exclude));
      assert.ok(tsconfig.exclude.includes("prisma.config.ts"));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should preserve existing user files without overwriting", async () => {
      const dir = await createTempDir();
      await fs.writeFile(path.join(dir, "package.json"), "{}");

      // Pre-existing schema with custom models
      const prismaDir = path.join(dir, "prisma");
      await fs.mkdir(prismaDir, { recursive: true });
      await fs.writeFile(
        path.join(prismaDir, "schema.prisma"),
        "// Custom user schema"
      );

      // Pre-existing prisma.config.ts
      await fs.writeFile(
        path.join(dir, "prisma.config.ts"),
        "// Custom user config"
      );

      // Pre-existing db.ts
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      await fs.writeFile(path.join(dir, "src", "db.ts"), "// Custom user db");

      await configureDatabase(
        {
          projectName: "preserve-app",
          framework: "express",
          typeScript: true,
          database: "postgres",
          auth: false,
          tools: [],
          packageManager: "npm",
        },
        dir
      );

      assert.equal(
        await fs.readFile(path.join(prismaDir, "schema.prisma"), "utf8"),
        "// Custom user schema"
      );
      assert.equal(
        await fs.readFile(path.join(dir, "prisma.config.ts"), "utf8"),
        "// Custom user config"
      );
      assert.equal(
        await fs.readFile(path.join(dir, "src", "db.ts"), "utf8"),
        "// Custom user db"
      );

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should configure MongoDB with Mongoose without Prisma artifacts", async () => {
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
      assert.ok(pkg.dependencies.mongoose);
      assert.equal(pkg.dependencies["@prisma/client"], undefined);
      assert.equal(pkg.dependencies["@prisma/adapter-pg"], undefined);
      assert.equal(pkg.dependencies["pg"], undefined);
      assert.equal(pkg.devDependencies?.prisma, undefined);

      assert.ok(!(await pathExists(path.join(dir, "prisma"))));
      assert.ok(!(await pathExists(path.join(dir, "prisma.config.ts"))));

      const dbFile = path.join(dir, "src", "db.ts");
      assert.ok(await pathExists(dbFile));
      const dbContent = await fs.readFile(dbFile, "utf8");
      assert.ok(dbContent.includes("mongoose"));
      assert.ok(!dbContent.includes("PrismaClient"));

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

  describe("Framework Generators (Express & Hono structure)", () => {
    it("should generate Express project in TypeScript with database and auth hooks", async () => {
      const dir = await createTempDir();

      await expressGenerator.generate({
        projectName: "express-ts",
        framework: "express",
        typeScript: true,
        database: "postgres",
        auth: "better-auth",
        tools: [],
        packageManager: "npm",
        targetDir: dir,
      });

      assert.ok(await pathExists(path.join(dir, "package.json")));
      assert.ok(await pathExists(path.join(dir, "src", "index.ts")));

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.equal(pkg.dependencies.express, "latest");
      assert.equal(pkg.devDependencies.typescript, "latest");
      assert.equal(pkg.scripts.dev, "tsx watch src/index.ts");

      const indexContent = await fs.readFile(
        path.join(dir, "src", "index.ts"),
        "utf8"
      );
      assert.ok(indexContent.includes('import express from "express";'));
      assert.ok(indexContent.includes('from "./db.js";'));
      assert.ok(indexContent.includes('from "better-auth/node";'));

      await fs.rm(dir, { recursive: true, force: true });
    });

    it("should generate Express project in JavaScript without TS types", async () => {
      const dir = await createTempDir();

      await expressGenerator.generate({
        projectName: "express-js",
        framework: "express",
        typeScript: false,
        database: "mongodb",
        auth: false,
        tools: [],
        packageManager: "npm",
        targetDir: dir,
      });

      assert.ok(await pathExists(path.join(dir, "package.json")));
      assert.ok(await pathExists(path.join(dir, "src", "index.js")));
      assert.equal(await pathExists(path.join(dir, "src", "index.ts")), false);

      const pkg = JSON.parse(
        await fs.readFile(path.join(dir, "package.json"), "utf8")
      );
      assert.equal(pkg.dependencies.express, "latest");
      assert.equal(pkg.devDependencies, undefined);
      assert.equal(pkg.scripts.dev, "node --watch src/index.js");

      await fs.rm(dir, { recursive: true, force: true });
    });
  });
});
