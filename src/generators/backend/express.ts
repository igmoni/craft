import fs from "node:fs/promises";
import path from "node:path";

import type { FrameworkGenerator } from "../../core/types/generator.js";

export const expressGenerator: FrameworkGenerator = {
  async generate(options) {
    const targetDir = options.targetDir;
    const isTS = options.typeScript;

    await fs.mkdir(path.join(targetDir, "src"), { recursive: true });

    const packageJson = {
      name: path.basename(targetDir).toLowerCase(),
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: isTS ? "tsx watch src/index.ts" : "node --watch src/index.js",
        build: isTS ? "tsc" : "node --check src/index.js",
        start: isTS ? "node dist/index.js" : "node src/index.js",
      },
      dependencies: {
        express: "latest",
      },
      ...(isTS && {
        devDependencies: {
          "@types/express": "latest",
          "@types/node": "latest",
          tsx: "latest",
          typescript: "latest",
        },
      }),
    };

    // Database imports and hooks
    let databaseImport = "";
    let databaseStartup = "";
    let databaseClose = "";

    if (options.database === "postgres") {
      databaseImport =
        'import { checkDatabaseConnection, disconnectDatabase } from "./db.js";';
      databaseStartup = `
    await checkDatabaseConnection();
    console.log("PostgreSQL connected via Prisma.");`;
      databaseClose = "\n    await disconnectDatabase();";
    } else if (options.database === "mongodb") {
      databaseImport =
        'import { connectDatabase, disconnectDatabase } from "./db.js";';
      databaseStartup = `
    await connectDatabase();
    console.log("MongoDB connected via Mongoose.");`;
      databaseClose = "\n    await disconnectDatabase();";
    }

    // Auth imports and middlewares
    let authImport = "";
    let authPreMiddleware = "";
    let authPostMiddleware = "";

    if (options.auth === "better-auth") {
      authImport = `import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";`;
      // Express middleware ordering: Better Auth must be mounted before express.json()
      authPreMiddleware = `
// Mount Better Auth handler before express.json()
app.all("/api/auth/*", toNodeHandler(auth));`;
    } else if (options.auth === "clerk") {
      authImport = 'import { clerkMiddleware } from "@clerk/express";';
      authPostMiddleware = `
// Clerk authentication middleware
app.use(clerkMiddleware());`;
    }

    const imports = [
      databaseImport,
      authImport,
      'import express from "express";',
    ]
      .filter(Boolean)
      .join("\n");

    const source = `${imports}

const app = express();
const port = Number(process.env.PORT ?? 3000);
${authPreMiddleware}
app.use(express.json());${authPostMiddleware}

app.get("/", (_req, res) => {
  res.json({ message: "Craft Express API is running" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: ${JSON.stringify(options.database)},
    auth: ${JSON.stringify(options.auth || "none")},
  });
});

async function startServer() {
  try {${databaseStartup}

    const server = app.listen(port, () => {
      console.log(\`Server running at http://localhost:\${port}\`);
    });

    const shutdown = async () => {
      server.close(async () => {
        try {${databaseClose}
          process.exit(0);
        } catch (error) {
          console.error("Error during graceful shutdown:", error);
          process.exit(1);
        }
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  }
}

startServer();
`;

    await fs.writeFile(
      path.join(targetDir, "package.json"),
      `${JSON.stringify(packageJson, null, 2)}\n`,
      { flag: "wx" }
    );

    await fs.writeFile(
      path.join(targetDir, "src", isTS ? "index.ts" : "index.js"),
      source,
      { flag: "wx" }
    );

    if (isTS) {
      await fs.writeFile(
        path.join(targetDir, "tsconfig.json"),
        `${JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "NodeNext",
              moduleResolution: "NodeNext",
              rootDir: "src",
              outDir: "dist",
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
            },
            include: ["src/**/*.ts"],
          },
          null,
          2
        )}\n`,
        { flag: "wx" }
      );
    }
  },
};
