import type {
  FrameworkCategory,
  FrameworkDefinition,
  FrameworkType,
} from "../types/framework.js";

export const frameworks: Record<FrameworkType, FrameworkDefinition> = {
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
      databases: [],
      authProviders: [],
      styling: ["tailwind"],
      packageManagers: ["npm", "pnpm", "yarn", "bun"],
      tools: ["prettier", "husky", "commitlint"],
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
      databases: [],
      authProviders: [],
      styling: ["tailwind"],
      packageManagers: ["npm", "pnpm", "yarn", "bun"],
      tools: ["eslint", "prettier", "husky", "commitlint"],
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
      databases: [],
      authProviders: ["better-auth", "clerk"],
      styling: ["tailwind"],
      packageManagers: ["npm", "pnpm", "yarn", "bun"],
      tools: ["eslint", "prettier", "husky", "commitlint"],
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
      databases: ["postgres", "mongodb"],
      authProviders: [],
      styling: [],
      packageManagers: ["npm", "pnpm", "yarn"],
      tools: ["eslint", "prettier", "husky", "commitlint"],
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
      databases: ["postgres", "mongodb"],
      authProviders: ["better-auth", "clerk"],
      styling: [],
      packageManagers: ["npm", "pnpm", "yarn", "bun"],
      tools: ["eslint", "prettier", "husky", "commitlint"],
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
      databases: ["postgres", "mongodb"],
      authProviders: [],
      styling: [],
      packageManagers: ["npm", "pnpm", "yarn", "bun"],
      tools: ["eslint", "prettier", "husky", "commitlint"],
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
      databases: ["postgres", "mongodb"],
      authProviders: [],
      styling: [],
      packageManagers: ["npm", "pnpm", "yarn", "bun"],
      tools: ["eslint", "prettier", "husky", "commitlint"],
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
      databases: ["postgres", "mongodb"],
      authProviders: ["better-auth", "authjs", "clerk"],
      styling: ["tailwind"],
      packageManagers: ["npm", "pnpm", "yarn", "bun"],
      tools: ["eslint", "prettier", "husky", "commitlint"],
    },
  },
};

export const getFramework = (id: FrameworkType): FrameworkDefinition => {
  const framework = frameworks[id];
  if (!framework) {
    throw new Error(`Unknown framework: "${id}"`);
  }
  return framework;
};

export const isFrameworkSupported = (id: string): id is FrameworkType => {
  return Object.prototype.hasOwnProperty.call(frameworks, id);
};

export const getFrameworksByCategory = (
  category: FrameworkCategory
): FrameworkDefinition[] => {
  return Object.values(frameworks).filter(
    (framework) => framework.category === category
  );
};

export const getCategories = (): {
  name: string;
  value: FrameworkCategory;
  description: string;
}[] => [
  {
    name: "Frontend",
    value: "frontend",
    description: "Client-side SPAs (Angular, Vue, React)",
  },
  {
    name: "Backend",
    value: "backend",
    description:
      "Server-side APIs & microservices (NestJS, Express, Fastify, Hono)",
  },
  {
    name: "Full-stack",
    value: "fullstack",
    description: "Complete SSR & server action apps (Next.js)",
  },
];

export const getFrameworkChoices = (category?: FrameworkCategory) => {
  const list = category
    ? getFrameworksByCategory(category)
    : Object.values(frameworks);
  return list.map((framework) => ({
    name: framework.name,
    value: framework.id,
  }));
};
