import type { FrameworkType } from "./framework.js";

export type DatabaseType = "postgres" | "mongodb" | "none";

export type ToolType = "eslint" | "prettier" | "husky" | "commitlint";

export type PackageManager = "npm" | "bun" | "pnpm" | "yarn";

export type AuthProvider = "better-auth" | "authjs" | "clerk";

export type AuthOption = AuthProvider | false;

export type UILibraryType = "shadcn";

export type UILibraryOption = UILibraryType | false;

export interface GenerateProjectConfig {
  projectName: string;
  framework: FrameworkType;
  typeScript: boolean;
  database: DatabaseType;
  auth: AuthOption;
  uiLibrary?: UILibraryOption;
  tools: ToolType[];
  packageManager: PackageManager;
}

export type PartialProjectConfig = Partial<GenerateProjectConfig>;

export interface GeneratorOptions extends GenerateProjectConfig {
  packageManager: PackageManager;
}
