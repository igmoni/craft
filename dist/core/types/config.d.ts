import type { AuthProvider, FrameworkType } from "./framework.js";
export type DatabaseType = "postgres" | "mongodb" | "none";
export type DatabaseOption = "postgres" | "mongodb";
export type ToolType = "eslint" | "prettier" | "husky" | "commitlint";
export type ToolOption = ToolType;
export type StylingOption = "tailwind";
export type PackageManager = "npm" | "bun" | "pnpm" | "yarn";
export type AuthOption = AuthProvider | false;
export type UILibraryType = "shadcn";
export type UILibraryOption = UILibraryType | false;
export interface GenerateProjectConfig {
    projectName: string;
    framework: FrameworkType;
    typeScript: boolean;
    database: DatabaseType;
    auth: AuthOption;
    tailwind?: boolean;
    uiLibrary?: UILibraryOption;
    tools: ToolType[];
    packageManager: PackageManager;
}
export interface GeneratorOptions extends GenerateProjectConfig {
}
export type PartialProjectConfig = Partial<GeneratorOptions>;
export type { AuthProvider, FrameworkCategory, FrameworkType, } from "./framework.js";
