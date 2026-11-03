export const generatorRegistry = {};
export const registerGenerator = (framework, generator) => {
    generatorRegistry[framework] = generator;
};
export const getGenerator = (framework) => {
    const generator = generatorRegistry[framework];
    if (!generator) {
        throw new Error(`No generator registered for framework: ${framework}`);
    }
    return generator;
};
export const resolveGenerator = (framework) => {
    return getGenerator(framework);
};
//# sourceMappingURL=generators.js.map