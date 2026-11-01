import type { AuthProvider, DatabaseType, UILibraryType } from "./config.js";

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
  typeScript: boolean;
  tailwind: boolean;
  database: DatabaseType[];
  authentication: AuthProvider[];
  uiLibraries: UILibraryType[];
}
