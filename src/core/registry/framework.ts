import type { FrameworkDefinition, FrameworkType } from "../types/framework.js";

export const frameworks = {
  angular: {
    id: "angular",
    name: "Angular",
    category: "frontend",
    capabilities: {
      typescript: true,
      javascript: true,
      tailwind: true,
      shadcn: false,
      database: true,
      authProviders: ["better-auth", "clerk"],
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
      database: true,
      authProviders: ["better-auth", "clerk"],
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
      database: true,
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
      authProviders: ["better-auth", "clerk"],
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
      authProviders: ["better-auth", "clerk"],
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
      authProviders: ["better-auth", "clerk"],
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
      authProviders: ["better-auth", "clerk"],
    },
  },
} satisfies Record<FrameworkType, FrameworkDefinition>;

export const getFramework = (id: FrameworkType) => {
  return frameworks[id];
};

export const getFrameworksByCategory = (
  category: FrameworkDefinition["category"]
) => {
  return Object.values(frameworks).filter(
    (framework) => framework.category === category
  );
};

export const getFrameworkChoices = () => {
  return Object.values(frameworks).map((framework) => ({
    name: framework.name,
    value: framework.id,
  }));
};
