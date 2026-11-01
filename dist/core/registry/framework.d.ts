import type { FrameworkDefinition, FrameworkType } from "../types/framework.js";
export declare const frameworks: {
    angular: {
        id: "angular";
        name: string;
        category: "frontend";
        capabilities: {
            typescript: true;
            javascript: false;
            tailwind: true;
            shadcn: false;
        };
    };
    vue: {
        id: "vue";
        name: string;
        category: "frontend";
        capabilities: {
            typescript: true;
            javascript: true;
            tailwind: true;
            shadcn: false;
        };
    };
    react: {
        id: "react";
        name: string;
        category: "frontend";
        capabilities: {
            typescript: true;
            javascript: true;
            tailwind: true;
            shadcn: true;
        };
    };
    nestjs: {
        id: "nestjs";
        name: string;
        category: "backend";
        capabilities: {
            typescript: true;
            javascript: true;
            tailwind: false;
            shadcn: false;
        };
    };
    express: {
        id: "express";
        name: string;
        category: "backend";
        capabilities: {
            typescript: true;
            javascript: true;
            tailwind: false;
            shadcn: false;
        };
    };
    fastify: {
        id: "fastify";
        name: string;
        category: "backend";
        capabilities: {
            typescript: true;
            javascript: true;
            tailwind: false;
            shadcn: false;
        };
    };
    hono: {
        id: "hono";
        name: string;
        category: "backend";
        capabilities: {
            typescript: true;
            javascript: true;
            tailwind: false;
            shadcn: false;
        };
    };
    next: {
        id: "next";
        name: string;
        category: "fullstack";
        capabilities: {
            typescript: true;
            javascript: true;
            tailwind: true;
            shadcn: true;
        };
    };
};
export declare const getFramework: (id: FrameworkType) => {
    id: "angular";
    name: string;
    category: "frontend";
    capabilities: {
        typescript: true;
        javascript: false;
        tailwind: true;
        shadcn: false;
    };
} | {
    id: "vue";
    name: string;
    category: "frontend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: true;
        shadcn: false;
    };
} | {
    id: "react";
    name: string;
    category: "frontend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: true;
        shadcn: true;
    };
} | {
    id: "nestjs";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "express";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "fastify";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "hono";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "next";
    name: string;
    category: "fullstack";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: true;
        shadcn: true;
    };
};
export declare const getFrameworksByCategory: (category: FrameworkDefinition["category"]) => ({
    id: "angular";
    name: string;
    category: "frontend";
    capabilities: {
        typescript: true;
        javascript: false;
        tailwind: true;
        shadcn: false;
    };
} | {
    id: "vue";
    name: string;
    category: "frontend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: true;
        shadcn: false;
    };
} | {
    id: "react";
    name: string;
    category: "frontend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: true;
        shadcn: true;
    };
} | {
    id: "nestjs";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "express";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "fastify";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "hono";
    name: string;
    category: "backend";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: false;
        shadcn: false;
    };
} | {
    id: "next";
    name: string;
    category: "fullstack";
    capabilities: {
        typescript: true;
        javascript: true;
        tailwind: true;
        shadcn: true;
    };
})[];
export declare const getFrameworkChoices: () => {
    name: string;
    value: "angular" | "express" | "fastify" | "hono" | "nestjs" | "next" | "react" | "vue";
}[];
