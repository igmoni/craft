
import fs from "node:fs/promises";
import path from "node:path";
import type { GenerateProjectConfig } from "../../types/utils.js";

export async function generateExpressProject(
  config: GenerateProjectConfig,
  targetDir: string,
): Promise<void> {
  await fs.mkdir(path.join(targetDir, "src"), { recursive: true });

  const packageJson = {
    name: path.basename(targetDir).toLowerCase(),
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: config.typeScript
        ? "tsx watch src/index.ts"
        : "node --watch src/index.js",
      build: config.typeScript ? "tsc" : "node --check src/index.js",
      start: config.typeScript ? "node dist/index.js" : "node src/index.js",
    },
    dependencies: {
      express: "^5.1.0",
    },
    ...(config.typeScript && {
      devDependencies: {
        "@types/express": "^5.0.0",
        "@types/node": "^22.0.0",
        tsx: "^4.20.0",
        typescript: "^5.0.0",
      },
    }),
  };

  const entryFile = config.typeScript ? "index.ts" : "index.js";

  const source = `import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get("/", (_req, res) => {
  res.json({ message: "Craft Express API is running" });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});
`;

  await fs.writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
    { flag: "wx" },
  );

  await fs.writeFile(
    path.join(targetDir, "src", entryFile),
    source,
    { flag: "wx" },
  );

  if (config.typeScript) {
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
        2,
      )}\n`,
      { flag: "wx" },
    );
  }
}
