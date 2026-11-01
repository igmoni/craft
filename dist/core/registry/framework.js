export const frameworks = {
    angular: {
        id: "angular",
        name: "Angular",
        category: "frontend",
        capabilities: {
            typescript: true,
            javascript: false,
            tailwind: true,
            shadcn: false,
        },
    },
    vue: {
        id: "vue",
        name: "Vue",
        category: "frontend",
        capabilities: {
            typescript: true,
            javascript: true,
            tailwind: true,
            shadcn: false,
        },
    },
    react: {
        id: "react",
        name: "React (Vite)",
        category: "frontend",
        capabilities: {
            typescript: true,
            javascript: true,
            tailwind: true,
            shadcn: true,
        },
    },
    nestjs: {
        id: "nestjs",
        name: "NestJS",
        category: "backend",
        capabilities: {
            typescript: true,
            javascript: true,
            tailwind: false,
            shadcn: false,
        },
    },
    express: {
        id: "express",
        name: "Express",
        category: "backend",
        capabilities: {
            typescript: true,
            javascript: true,
            tailwind: false,
            shadcn: false,
        },
    },
    fastify: {
        id: "fastify",
        name: "Fastify",
        category: "backend",
        capabilities: {
            typescript: true,
            javascript: true,
            tailwind: false,
            shadcn: false,
        },
    },
    hono: {
        id: "hono",
        name: "Hono",
        category: "backend",
        capabilities: {
            typescript: true,
            javascript: true,
            tailwind: false,
            shadcn: false,
        },
    },
    next: {
        id: "next",
        name: "Next.js",
        category: "fullstack",
        capabilities: {
            typescript: true,
            javascript: true,
            tailwind: true,
            shadcn: true,
        },
    },
};
export const getFramework = (id) => {
    return frameworks[id];
};
export const getFrameworksByCategory = (category) => {
    return Object.values(frameworks).filter((framework) => framework.category === category);
};
export const getFrameworkChoices = () => {
    return Object.values(frameworks).map((framework) => ({
        name: framework.name,
        value: framework.id,
    }));
};
//# sourceMappingURL=framework.js.map