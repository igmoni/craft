import type { FrameworkType } from "../types/framework.js";
import type { FrameworkGenerator } from "../types/generator.js";
export declare const generatorRegistry: Partial<Record<FrameworkType, FrameworkGenerator>>;
export declare const registerGenerator: (framework: FrameworkType, generator: FrameworkGenerator) => void;
export declare const getGenerator: (framework: FrameworkType) => FrameworkGenerator;
export declare const resolveGenerator: (framework: FrameworkType) => FrameworkGenerator;
