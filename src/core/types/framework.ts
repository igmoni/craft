export type FrameworkType =
  | "angular"
  | "vue"
  | "react"
  | "nestjs"
  | "express"
  | "fastify"
  | "hono"
  | "next";

export type FrameworkCategory = "frontend" | "backend" | "fullstack";

export interface FrameworkCapabilities {
  typescript: boolean;
  javascript: boolean;
  tailwind: boolean;
  shadcn: boolean;
}

export interface FrameworkDefinition {
  id: FrameworkType;
  name: string;
  category: FrameworkCategory;
  capabilities: FrameworkCapabilities;
}
