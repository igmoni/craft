import type { GeneratorOptions } from "./config.js";
export interface FrameworkGeneratorOptions extends GeneratorOptions {
    targetDir: string;
}
export interface FrameworkGenerator {
    generate(options: FrameworkGeneratorOptions): Promise<void>;
}
