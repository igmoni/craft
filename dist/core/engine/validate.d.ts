import type { GeneratorOptions, PartialProjectConfig } from "../types/config.js";
import type { FrameworkType } from "../types/framework.js";
export declare function validateProjectName(value: string): true | string;
export declare function normalizeProjectName(value: string): string;
export interface TargetDirectoryInfo {
    targetDir: string;
    actualProjectName: string;
    isCurrentDirectory: boolean;
    exists: boolean;
    isEmpty: boolean;
}
export declare function validateTargetDirectory(projectName: string): Promise<TargetDirectoryInfo>;
export declare function validateExistingConfig(config: PartialProjectConfig, framework: FrameworkType): void;
export declare function validateConfig(config: GeneratorOptions): void;
