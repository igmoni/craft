import fs from "node:fs/promises";
import path from "node:path";

import type { GenerateProjectConfig } from "../core/types/config.js";
import { pathExists } from "../utils/error.js";

interface PackageJson {
  type?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

async function addEnvironmentVariable(
  filePath: string,
  key: string,
  value: string
): Promise<void> {
  const content = (await pathExists(filePath))
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

  const content = (await pathExists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";

  const existing = new Set(content.split(/\r?\n/).map((line) => line.trim()));
  const missing = rules.filter((rule) => !existing.has(rule));

  if (missing.length === 0) return;

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  await fs.writeFile(filePath, `${content}${separator}${missing.join("\n")}\n`);
}

function getPrismaSchema(): string {
  return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;
}

function getPrismaSource(typeScript: boolean): string {
  if (typeScript) {
    return `import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

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

  return `import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection() {
  await prisma.$connect();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
`;
}

function getMongooseSource(typeScript: boolean): string {
  if (typeScript) {
    return `import "dotenv/config";
import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = cached;

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export { mongoose };
`;
  }

  return `import "dotenv/config";
import mongoose from "mongoose";

let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export { mongoose };
`;
}

async function writeFileIfMissing(
  filePath: string,
  content: string
): Promise<void> {
  if (await pathExists(filePath)) return;

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, { flag: "wx" });
}

export async function configureDatabase(
  config: GenerateProjectConfig,
  projectDir: string
): Promise<void> {
  if (config.database === "none") return;

  const packagePath = path.join(projectDir, "package.json");

  let packageJson: PackageJson = {};
  if (await pathExists(packagePath)) {
    packageJson = JSON.parse(
      await fs.readFile(packagePath, "utf8")
    ) as PackageJson;
  }

  packageJson.dependencies ??= {};
  packageJson.scripts ??= {};

  packageJson.dependencies.dotenv ??= "latest";

  if (config.database === "postgres") {
    packageJson.dependencies["@prisma/client"] ??= "latest";
    packageJson.devDependencies ??= {};
    packageJson.devDependencies.prisma ??= "latest";

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
  } else if (config.database === "mongodb") {
    packageJson.dependencies.mongoose ??= "latest";

    await addEnvironmentVariable(
      path.join(projectDir, ".env.example"),
      "MONGODB_URI",
      "mongodb://127.0.0.1:27017/mydb"
    );
  }

  // Determine where to write the database client.
  const hasSrcDir = await pathExists(path.join(projectDir, "src"));
  let sourceDirectory: string;

  if (config.framework === "next") {
    sourceDirectory = hasSrcDir ? path.join("src", "lib") : "lib";
  } else {
    sourceDirectory = "src";
  }

  const databaseDirectory = path.join(projectDir, sourceDirectory);
  await fs.mkdir(databaseDirectory, { recursive: true });

  const extension = config.typeScript ? "ts" : "js";
  const databaseFile = path.join(databaseDirectory, `db.${extension}`);

  const databaseSource =
    config.database === "postgres"
      ? getPrismaSource(config.typeScript)
      : getMongooseSource(config.typeScript);

  await writeFileIfMissing(databaseFile, databaseSource);
  await addGitignoreRules(projectDir);

  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
