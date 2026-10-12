import { input, select, confirm, checkbox } from "@inquirer/prompts";
export const promptProjectConfig = async (existing = {}) => {
    const projectName = existing.projectName ??
        (await input({
            message: "What is your project name?",
            validate: (value) => {
                const name = value.trim();
                if (!name) {
                    return "Project name is required.";
                }
                if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
                    return "Use only letters, numbers, hyphens, and underscores.";
                }
                return true;
            },
        }))
            .trim()
            .toLowerCase();
    const framework = existing.framework ??
        (await select({
            message: "Choose a framework",
            choices: [
                {
                    name: "Next.js",
                    value: "next",
                },
                {
                    name: "Vite",
                    value: "vite",
                },
                {
                    name: "Express",
                    value: "express",
                },
            ],
        }));
    const typeScript = existing.typeScript ??
        (await confirm({
            message: "Use typeScript?",
            default: true,
        }));
    const database = existing.database ??
        (await select({
            message: "Choose a database",
            choices: [
                {
                    name: "PostgreSQL",
                    value: "postgres",
                },
                {
                    name: "MongoDB",
                    value: "mongodb",
                },
                {
                    name: "None",
                    value: "none",
                },
            ],
        }));
    const authChoice = existing.auth ??
        (await confirm({
            message: "Add authentication?",
            default: false,
        }));
    const auth = authChoice === false
        ? false
        : typeof authChoice === "string"
            ? authChoice
            : await select({
                message: "Choose an authentication provider",
                choices: [
                    { name: "Better Auth", value: "better-auth" },
                    { name: "Auth.js (Next.js only)", value: "authjs" },
                    { name: "Clerk", value: "clerk" },
                ],
            });
    const tools = existing.tools ??
        (await checkbox({
            message: "Which tools do you want?",
            choices: [
                {
                    name: "ESLint",
                    value: "eslint",
                    checked: true,
                },
                {
                    name: "Prettier",
                    value: "prettier",
                    checked: true,
                },
                {
                    name: "Husky",
                    value: "husky",
                },
                {
                    name: "Commitlint",
                    value: "commitlint",
                },
            ],
        }));
    return {
        projectName,
        framework,
        typeScript,
        database,
        auth,
        tools,
    };
};
//# sourceMappingURL=project.js.map