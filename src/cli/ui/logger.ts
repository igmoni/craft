import pc from "picocolors";

import { LINKS } from "../../config/links.js";
import { getFramework } from "../../core/registry/framework.js";
import type { GeneratorOptions } from "../../core/types/config.js";

export const logger = {
  step(message: string): void {
    console.log(`  ${pc.cyan("›")} ${pc.bold(message)}`);
  },

  substep(message: string): void {
    console.log(`    ${pc.dim("•")} ${pc.dim(message)}`);
  },

  success(message: string): void {
    console.log(`  ${pc.green("✓")} ${pc.bold(message)}`);
  },

  warn(message: string): void {
    console.log(`  ${pc.yellow("▲")} ${pc.yellow(message)}`);
  },

  error(message: string): void {
    console.log(`  ${pc.red("✖")} ${pc.red(pc.bold(message))}`);
  },

  info(message: string): void {
    console.log(`  ${pc.blue("ℹ")} ${message}`);
  },

  blank(): void {
    console.log("");
  },

  projectSummary(config: GeneratorOptions, targetDir: string): void {
    const frameworkDef = getFramework(config.framework);

    const formatRow = (label: string, value: string): string => {
      const padded = label.padEnd(14, " ");
      return `  ${pc.dim(padded)} ${pc.white(value)}`;
    };

    const databaseLabel =
      config.database === "postgres"
        ? "PostgreSQL (Prisma)"
        : config.database === "mongodb"
          ? "MongoDB (Mongoose)"
          : "None";

    const authLabel =
      config.auth === "better-auth"
        ? "Better Auth"
        : config.auth === "authjs"
          ? "Auth.js"
          : config.auth === "clerk"
            ? "Clerk"
            : "None";

    const uiLabel = config.uiLibrary === "shadcn" ? "shadcn/ui" : "None";
    const languageLabel = config.typeScript ? "TypeScript" : "JavaScript";

    console.log("");
    console.log(
      `  ${pc.green("✓")} ${pc.bold("Project created successfully!")}`
    );
    console.log("");
    console.log(formatRow("Project", config.projectName));
    console.log(formatRow("Framework", frameworkDef.name));
    console.log(formatRow("Language", languageLabel));
    console.log(formatRow("Database", databaseLabel));
    console.log(formatRow("Auth", authLabel));
    if (frameworkDef.capabilities.shadcn) {
      console.log(formatRow("UI", uiLabel));
    }
    console.log(formatRow("Package", config.packageManager));
    console.log(formatRow("Location", targetDir));
    console.log("");

    console.log(`  ${pc.bold("Next steps:")}`);
    console.log("");
    if (config.projectName !== ".") {
      console.log(`  ${pc.cyan(`cd ${config.projectName}`)}`);
    }

    if (config.database === "postgres") {
      console.log(`  ${pc.dim("# 1. Ensure DATABASE_URL is set in .env")}`);
      console.log(`  ${pc.cyan(`${config.packageManager} run db:migrate`)}`);
    }

    if (config.auth) {
      console.log(
        `  ${pc.dim("# See AUTH_SETUP.md for provider API keys & dashboard setup")}`
      );
    }

    const devCommand =
      config.framework === "nestjs"
        ? `${config.packageManager} run start:dev`
        : `${config.packageManager} run dev`;

    console.log(`  ${pc.cyan(devCommand)}`);
    console.log("");
    console.log(`  ${pc.dim("Help improve Craft:")}`);
    console.log(`  ${pc.dim("Issues:")}   ${pc.dim(LINKS.issues)}`);
    console.log(`  ${pc.dim("Feedback:")} ${pc.dim(LINKS.feedback)}`);
    console.log("");
    console.log(`  ${pc.blue("Happy building! 🚀")}`);
    console.log("");
  },
};
