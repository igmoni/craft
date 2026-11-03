export type FrameworkType = "angular" | "vue" | "react" | "nestjs" | "express" | "fastify" | "hono" | "next";
export type FrameworkCategory = "frontend" | "backend" | "fullstack";
export type AuthProvider = "better-auth" | "authjs" | "clerk";
export type DatabaseOption = "postgres" | "mongodb";
export type StylingOption = "tailwind";
export type ToolOption = "eslint" | "prettier" | "husky" | "commitlint";
export type PackageManagerOption = "npm" | "bun" | "pnpm" | "yarn";
export interface FrameworkCapabilities {
    typescript: boolean;
    javascript: boolean;
    tailwind: boolean;
    shadcn: boolean;
    database: boolean;
    databases: DatabaseOption[];
    authProviders: AuthProvider[];
    styling: StylingOption[];
    packageManagers: PackageManagerOption[];
    tools: ToolOption[];
}
export interface FrameworkDefinition {
    id: FrameworkType;
    name: string;
    category: FrameworkCategory;
    capabilities: FrameworkCapabilities;
}
