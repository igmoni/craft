export type GeneratorStepId = "validate" | "staging" | "scaffold" | "tailwind" | "database" | "auth" | "tools" | "env" | "merge" | "install" | "post-install" | "complete";
export interface GeneratorStep {
    id: GeneratorStepId;
    name: string;
    description: string;
}
export declare const GENERATOR_STEPS: GeneratorStep[];
