import type { GenerateProjectConfig } from "../core/types/config.js";
export declare function getPrismaSchema(): string;
export declare function getPrismaConfig(): string;
export declare function calculatePrismaClientImport(dbFilePath: string, projectDir: string): string;
export declare function getPrismaSource(typeScript: boolean, clientImport?: string): string;
export declare function configureDatabase(config: GenerateProjectConfig, projectDir: string): Promise<void>;
