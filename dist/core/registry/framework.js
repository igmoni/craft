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
            database: false,
            authProviders: [],
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
            database: false,
            authProviders: [],
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
            database: false,
            authProviders: ["better-auth", "clerk"],
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
            database: true,
            authProviders: [],
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
            database: true,
            authProviders: ["better-auth", "clerk"],
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
            database: true,
            authProviders: [],
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
            database: true,
            authProviders: [],
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
            database: true,
            authProviders: ["better-auth", "authjs", "clerk"],
        },
    },
};
export const getFramework = (id) => {
    const framework = frameworks[id];
    if (!framework) {
        throw new Error(`Unknown framework: "${id}"`);
    }
    return framework;
};
export const isFrameworkSupported = (id) => {
    return Object.prototype.hasOwnProperty.call(frameworks, id);
};
export const getFrameworksByCategory = (category) => {
    return Object.values(frameworks).filter((framework) => framework.category === category);
};
export const getCategories = () => [
    {
        name: "Frontend",
        value: "frontend",
        description: "Client-side SPAs (Angular, Vue, React)",
    },
    {
        name: "Backend",
        value: "backend",
        description: "Server-side APIs & microservices (NestJS, Express, Fastify, Hono)",
    },
    {
        name: "Full-stack",
        value: "fullstack",
        description: "Complete SSR & server action apps (Next.js)",
    },
];
export const getFrameworkChoices = (category) => {
    const list = category
        ? getFrameworksByCategory(category)
        : Object.values(frameworks);
    return list.map((framework) => ({
        name: framework.name,
        value: framework.id,
    }));
};
//# sourceMappingURL=framework.js.map