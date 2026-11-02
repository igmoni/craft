import fs from "node:fs/promises";
import path from "node:path";

import type { GenerateProjectConfig } from "../core/types/config.js";

interface PackageJson {
  type?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

async function addEnvironmentVariable(
  filePath: string,
  key: string,
  value: string
): Promise<void> {
  const content = (await exists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";

  const hasKey = content
    .split(/\r?\n/)
    .some((line) => line.trimStart().startsWith(`${key}=`));

  if (hasKey) return;

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";

  await fs.writeFile(filePath, `${content}${separator}${key}=${value}\n`);
}

async function addGitignoreRules(projectDir: string): Promise<void> {
  const filePath = path.join(projectDir, ".gitignore");
  const rules = [".env", ".env.*", "!.env.example"];

  const content = (await exists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";

  const existing = new Set(content.split(/\r?\n/).map((line) => line.trim()));

  const missing = rules.filter((rule) => !existing.has(rule));

  if (missing.length === 0) return;

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";

  await fs.writeFile(filePath, `${content}${separator}${missing.join("\n")}\n`);
}

function getPrismaSchema(): string {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
`;
}

function getPrismaConfig(): string {
  return `import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
`;
}

function getPrismaSource(): string {
  return `import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
`;
}

function getMongooseSource(typeScript: boolean): string {
  if (typeScript) {
    return `import "dotenv/config";
import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(uri);
}

export { mongoose };
`;
  }

  return `import "dotenv/config";
import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(uri);
}

export { mongoose };
`;
}

async function writeFileIfMissing(
  filePath: string,
  content: string
): Promise<void> {
  if (await exists(filePath)) return;

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  await fs.writeFile(filePath, content, { flag: "wx" });
}

export async function configureDatabase(
  config: GenerateProjectConfig,
  projectDir: string
): Promise<void> {
  if (config.database === "none") return;

  const packagePath = path.join(projectDir, "package.json");

  const packageJson = JSON.parse(
    await fs.readFile(packagePath, "utf8")
  ) as PackageJson;

  packageJson.dependencies ??= {};
  packageJson.scripts ??= {};

  // Prisma 7 requires ESM configuration.
  packageJson.type ??= "module";

  packageJson.dependencies.dotenv ??= "^16.4.7";

  if (config.database === "postgres") {
    packageJson.dependencies["@prisma/client"] ??= "^7.10.0";
    packageJson.dependencies["@prisma/adapter-pg"] ??= "^7.10.0";
    packageJson.dependencies.pg ??= "^8.16.3";

    packageJson.devDependencies ??= {};

    packageJson.devDependencies.prisma ??= "^7.10.0";

    if (config.typeScript) {
      packageJson.devDependencies["@types/pg"] ??= "^8.15.5";
    }

    packageJson.scripts["db:generate"] ??= "prisma generate";
    packageJson.scripts["db:migrate"] ??= "prisma migrate dev";
    packageJson.scripts["db:deploy"] ??= "prisma migrate deploy";
    packageJson.scripts["db:studio"] ??= "prisma studio";

    await addEnvironmentVariable(
      path.join(projectDir, ".env.example"),
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/mydb?schema=public"
    );

    const prismaDirectory = path.join(projectDir, "prisma");

    await fs.mkdir(prismaDirectory, { recursive: true });

    await writeFileIfMissing(
      path.join(prismaDirectory, "schema.prisma"),
      getPrismaSchema()
    );

    await writeFileIfMissing(
      path.join(projectDir, "prisma.config.ts"),
      getPrismaConfig()
    );
  } else {
    packageJson.dependencies.mongoose ??= "^8.18.0";

    await addEnvironmentVariable(
      path.join(projectDir, ".env.example"),
      "MONGODB_URI",
      "mongodb://127.0.0.1:27017/mydb"
    );
  }

  const sourceDirectory =
    config.framework === "next"
      ? (await exists(path.join(projectDir, "src")))
        ? "src/lib"
        : "lib"
      : "src";

  const databaseDirectory = path.join(projectDir, sourceDirectory);

  await fs.mkdir(databaseDirectory, { recursive: true });

  const extension = config.typeScript ? "ts" : "js";

  const databaseFile = path.join(databaseDirectory, `db.${extension}`);

  const databaseSource =
    config.database === "postgres"
      ? getPrismaSource()
      : getMongooseSource(config.typeScript);

  await writeFileIfMissing(databaseFile, databaseSource);

  await addGitignoreRules(projectDir);

  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
