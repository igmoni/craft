export type FrameworkType = "next" | "vite" | "express" | "angular";
export type DatabaseType = "postgres" | "mongodb" | "none";
export type ToolType = "eslint" | "prettier" | "husky" | "commitlint";
export interface generateProjectType {
    projectName: string;
    framework: FrameworkType;
    typeScript: boolean;
    database: DatabaseType;
    auth: boolean;
    tools: ToolType[];
}
