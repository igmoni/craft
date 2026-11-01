import fs from "node:fs/promises";
import path from "node:path";
export async function generateExpressProject(config, targetDir) {
    await fs.mkdir(path.join(targetDir, "src"), { recursive: true });
    const isTS = config.typeScript;
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
            express: "^5.1.0",
        },
        ...(isTS && {
            devDependencies: {
                "@types/express": "^5.0.0",
                "@types/node": "^22.0.0",
                tsx: "^4.20.0",
                typescript: "^5.0.0",
            },
        }),
    };
    let databaseImport = "";
    let databaseStartup = "";
    if (config.database === "postgres") {
        databaseImport = isTS
            ? 'import { checkDatabaseConnection, db } from "./db.js";'
            : 'import { checkDatabaseConnection, db } from "./db.js";';
        databaseStartup = `
    await checkDatabaseConnection();
    console.log("PostgreSQL connected.");`;
    }
    else if (config.database === "mongodb") {
        databaseImport = 'import { connectDatabase, mongoose } from "./db.js";';
        databaseStartup = `
    await connectDatabase();
    console.log("MongoDB connected.");`;
    }
    const databaseClose = config.database === "postgres"
        ? "\n    await db.end();"
        : config.database === "mongodb"
            ? "\n    await mongoose.disconnect();"
            : "";
    const source = `${databaseImport}

import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Craft Express API is running" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: ${JSON.stringify(config.database)},
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
          console.error("Error closing database:", error);
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
    await fs.writeFile(path.join(targetDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, { flag: "wx" });
    await fs.writeFile(path.join(targetDir, "src", isTS ? "index.ts" : "index.js"), source, { flag: "wx" });
    if (isTS) {
        await fs.writeFile(path.join(targetDir, "tsconfig.json"), `${JSON.stringify({
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
        }, null, 2)}\n`, { flag: "wx" });
    }
}
//# sourceMappingURL=express.js.map