import type { FrameworkType } from "../types/framework.js";
import type { FrameworkGenerator } from "../types/generator.js";

export const generatorRegistry: Partial<
  Record<FrameworkType, FrameworkGenerator>
> = {};

export const registerGenerator = (
  framework: FrameworkType,
  generator: FrameworkGenerator
) => {
  generatorRegistry[framework] = generator;
};

export const getGenerator = (framework: FrameworkType) => {
  const generator = generatorRegistry[framework];

  if (!generator) {
    throw new Error(`No generator registered for framework: ${framework}`);
  }

  return generator;
};

export const resolveGenerator = (framework: FrameworkType) => {
  return getGenerator(framework);
};
