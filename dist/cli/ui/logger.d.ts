import type { GeneratorOptions } from "../../core/types/config.js";
export declare const logger: {
    step(message: string): void;
    substep(message: string): void;
    success(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    info(message: string): void;
    blank(): void;
    projectSummary(config: GeneratorOptions, targetDir: string): void;
};
