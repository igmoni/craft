import fs from "node:fs/promises";
import path from "node:path";

import type { GenerateProjectConfig } from "../types/utils.js";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
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

  if (!hasKey) {
    const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";

    await fs.writeFile(filePath, `${content}${separator}${key}=${value}\n`);
  }
}

async function addGitignoreRules(projectDir: string): Promise<void> {
  const filePath = path.join(projectDir, ".gitignore");
  const rules = [".env", ".env.*", "!.env.example"];

  const content = (await exists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";

  const existing = new Set(content.split(/\r?\n/).map((line) => line.trim()));
  const missing = rules.filter((rule) => !existing.has(rule));

  if (missing.length > 0) {
    const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";

    await fs.writeFile(
      filePath,
      `${content}${separator}${missing.join("\n")}\n`
    );
  }
}

function getDatabaseSource(
  database: "postgres" | "mongodb",
  typeScript: boolean
): string {
  if (database === "postgres") {
    return typeScript
      ? `import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await db.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
`
      : `import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function checkDatabaseConnection() {
  const client = await db.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
`;
  }

  return typeScript
    ? `import "dotenv/config";
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
`
    : `import "dotenv/config";
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

export async function configureDatabase(
  config: GenerateProjectConfig,
  projectDir: string
): Promise<void> {
  if (config.database === "none") {
    return;
  }

  const packagePath = path.join(projectDir, "package.json");
  const packageJson = JSON.parse(
    await fs.readFile(packagePath, "utf8")
  ) as PackageJson;

  packageJson.dependencies ??= {};

  // Load environment variables consistently outside Next.js too.
  packageJson.dependencies["dotenv"] ??= "^16.4.7";

  if (config.database === "postgres") {
    packageJson.dependencies["pg"] ??= "^8.16.3";

    if (config.typeScript) {
      packageJson.devDependencies ??= {};
      packageJson.devDependencies["@types/pg"] ??= "^8.15.5";
    }

    await addEnvironmentVariable(
      path.join(projectDir, ".env.example"),
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/mydb"
    );
  } else {
    packageJson.dependencies["mongoose"] ??= "^8.18.0";

    await addEnvironmentVariable(
      path.join(projectDir, ".env.example"),
      "MONGODB_URI",
      "mongodb://127.0.0.1:27017/mydb"
    );
  }

  const sourceDirectory =
    config.framework === "vite"
      ? "server"
      : config.framework === "next"
        ? (await exists(path.join(projectDir, "src")))
          ? "src/lib"
          : "lib"
        : "src";

  const databaseDirectory = path.join(projectDir, sourceDirectory);
  await fs.mkdir(databaseDirectory, { recursive: true });

  const extension = config.typeScript ? "ts" : "js";
  const fileName =
    config.framework === "express" ? `db.${extension}` : `db.${extension}`;

  const databaseFile = path.join(databaseDirectory, fileName);

  if (!(await exists(databaseFile))) {
    await fs.writeFile(
      databaseFile,
      getDatabaseSource(config.database, config.typeScript),
      { flag: "wx" }
    );
  }

  await addGitignoreRules(projectDir);

  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
