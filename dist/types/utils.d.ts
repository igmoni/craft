export type FrameworkType = "next" | "vite" | "express";
export type DatabaseType = "postgres" | "mongodb" | "none";
export type ToolType = "eslint" | "prettier" | "husky" | "commitlint";
export interface GenerateProjectConfig {
    projectName: string;
    framework: FrameworkType;
    typeScript: boolean;
    database: DatabaseType;
    auth: boolean;
    tools: ToolType[];
}
export type PartialProjectConfig = Partial<GenerateProjectConfig>;
