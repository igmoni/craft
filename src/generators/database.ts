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

async function addGitignoreRules(
  projectDir: string,
  extraRules: string[] = []
): Promise<void> {
  const filePath = path.join(projectDir, ".gitignore");
  const rules = [".env", ".env.*", "!.env.example", ...extraRules];

  const content = (await pathExists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";

  const existing = new Set(content.split(/\r?\n/).map((line) => line.trim()));
  const missing = rules.filter((rule) => !existing.has(rule));

  if (missing.length === 0) return;

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  await fs.writeFile(filePath, `${content}${separator}${missing.join("\n")}\n`);
}

export function getPrismaSchema(): string {
  return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
`;
}

export function getPrismaConfig(): string {
  return `import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
`;
}

export function calculatePrismaClientImport(
  dbFilePath: string,
  projectDir: string
): string {
  const dbDir = path.dirname(dbFilePath);
  const clientTarget = path.join(
    projectDir,
    "src",
    "generated",
    "prisma",
    "client"
  );
  let relativePath = path.relative(dbDir, clientTarget).replace(/\\/g, "/");
  if (!relativePath.startsWith("./") && !relativePath.startsWith("../")) {
    relativePath = `./${relativePath}`;
  }
  return relativePath;
}

export function getPrismaSource(
  typeScript: boolean,
  clientImport = "./generated/prisma/client"
): string {
  if (typeScript) {
    return `import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "${clientImport}";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
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
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "${clientImport}";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
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

  if (config.database === "postgres") {
    packageJson.dependencies["@prisma/client"] = "^7.0.0";
    packageJson.dependencies["@prisma/adapter-pg"] = "^7.0.0";
    packageJson.dependencies.pg = "^8.16.3";
    packageJson.dependencies.dotenv = "^16.4.7";
    packageJson.devDependencies ??= {};
    packageJson.devDependencies.prisma = "^7.0.0";
    if (config.typeScript) {
      packageJson.devDependencies["@types/pg"] ??= "^8.16.0";
    }

    packageJson.scripts["db:generate"] ??= "prisma generate";
    packageJson.scripts["db:migrate"] ??= "prisma migrate dev";
    packageJson.scripts["db:deploy"] ??= "prisma migrate deploy";
    packageJson.scripts["db:studio"] ??= "prisma studio";

    await addEnvironmentVariable(
      path.join(projectDir, ".env.example"),
      "DATABASE_URL",
      '"postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"'
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

    if (config.typeScript) {
      const tsconfigPath = path.join(projectDir, "tsconfig.json");
      if (await pathExists(tsconfigPath)) {
        try {
          const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, "utf8"));
          if (tsconfig.compilerOptions?.rootDir && !tsconfig.include) {
            tsconfig.exclude = Array.isArray(tsconfig.exclude)
              ? [...new Set([...tsconfig.exclude, "prisma.config.ts"])]
              : ["node_modules", "prisma.config.ts"];
            await fs.writeFile(
              tsconfigPath,
              `${JSON.stringify(tsconfig, null, 2)}\n`
            );
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  } else if (config.database === "mongodb") {
    packageJson.dependencies.dotenv ??= "^16.4.7";
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

  let databaseSource: string;
  if (config.database === "postgres") {
    const clientImport = calculatePrismaClientImport(databaseFile, projectDir);
    databaseSource = getPrismaSource(config.typeScript, clientImport);
  } else {
    databaseSource = getMongooseSource(config.typeScript);
  }

  await writeFileIfMissing(databaseFile, databaseSource);
  await addGitignoreRules(
    projectDir,
    config.database === "postgres" ? ["src/generated"] : []
  );

  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
