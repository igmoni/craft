export type FrameworkType = "next" | "vite" | "express";

export type DatabaseType = "postgres" | "mongodb" | "none";

export type ToolType = "eslint" | "prettier" | "husky" | "commitlint";

export type PackageManager = "npm" | "bun" | "pnpm" | "yarn"

export interface GenerateProjectConfig {
  projectName: string;
  framework: FrameworkType;
  typeScript: boolean;
  database: DatabaseType;
  auth: boolean;
  tools: ToolType[];
}

export type PartialProjectConfig = Partial<GenerateProjectConfig>;

export interface GeneratorOptions extends GenerateProjectConfig {
  packageManager: PackageManager;
}