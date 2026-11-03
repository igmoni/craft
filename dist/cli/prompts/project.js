import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { normalizeProjectName, validateExistingConfig, validateProjectName, } from "../../core/engine/validate.js";
import { getCategories, getFramework, getFrameworkChoices, } from "../../core/registry/framework.js";
const authProviderNames = {
    "better-auth": "Better Auth",
    authjs: "Auth.js",
    clerk: "Clerk",
};
export const promptProjectConfig = async (existing = {}) => {
    // Step 1: Project name
    const rawProjectName = existing.projectName ??
        (await input({
            message: "What is your project name?",
            default: "my-app",
            validate: validateProjectName,
        }));
    const projectName = normalizeProjectName(rawProjectName);
    const nameValidation = validateProjectName(projectName);
    if (nameValidation !== true) {
        throw new Error(nameValidation);
    }
    // Step 2 & 3: Framework (Category + Framework)
    let framework;
    if (existing.framework) {
        framework = existing.framework;
    }
    else {
        const category = await select({
            message: "Select project category",
            choices: getCategories().map((cat) => ({
                name: `${cat.name.padEnd(12)} - ${cat.description}`,
                value: cat.value,
            })),
            default: "fullstack",
        });
        framework = await select({
            message: "Choose a framework",
            choices: getFrameworkChoices(category).map((f) => ({
                name: f.name,
                value: f.value,
            })),
        });
    }
    const frameworkInfo = getFramework(framework);
    const capabilities = frameworkInfo.capabilities;
    // Validate any existing flags before prompting remaining questions
    validateExistingConfig(existing, framework);
    // Step 4: Language (TypeScript vs JavaScript)
    let typeScript;
    if (existing.typeScript !== undefined) {
        typeScript = existing.typeScript;
    }
    else if (capabilities.typescript && capabilities.javascript) {
        typeScript = await confirm({
            message: "Use TypeScript?",
            default: true,
        });
    }
    else {
        // Only one language supported (e.g. Angular is TypeScript only)
        typeScript = capabilities.typescript;
    }
    // Step 5: Database (only if supported by framework)
    let database = "none";
    if (capabilities.database) {
        if (existing.database !== undefined) {
            database = existing.database;
        }
        else {
            database = await select({
                message: "Choose a database",
                choices: [
                    { name: "PostgreSQL (Prisma)", value: "postgres" },
                    { name: "MongoDB (Mongoose)", value: "mongodb" },
                    { name: "None", value: "none" },
                ],
                default: "none",
            });
        }
    }
    // Step 6: Authentication (only if supported by framework)
    let auth = false;
    const availableAuthProviders = capabilities.authProviders;
    if (availableAuthProviders.length > 0) {
        if (existing.auth !== undefined) {
            auth = existing.auth;
        }
        else {
            const wantsAuth = await confirm({
                message: "Add authentication?",
                default: false,
            });
            if (wantsAuth) {
                if (availableAuthProviders.length === 1) {
                    auth = availableAuthProviders[0];
                }
                else {
                    auth = await select({
                        message: "Choose an authentication provider",
                        choices: availableAuthProviders.map((provider) => ({
                            name: authProviderNames[provider] ?? provider,
                            value: provider,
                        })),
                    });
                }
            }
        }
    }
    // Step 7: UI Library (only if supported by framework)
    let uiLibrary = false;
    if (capabilities.shadcn) {
        if (existing.uiLibrary !== undefined) {
            uiLibrary = existing.uiLibrary;
        }
        else {
            const wantsShadcn = await confirm({
                message: "Add shadcn/ui?",
                default: false,
            });
            uiLibrary = wantsShadcn ? "shadcn" : false;
        }
    }
    // Step 8: Development Tools
    let tools;
    if (existing.tools !== undefined) {
        tools = existing.tools;
    }
    else {
        tools = await checkbox({
            message: "Which development tools do you want?",
            choices: [
                { name: "ESLint", value: "eslint", checked: true },
                { name: "Prettier", value: "prettier", checked: true },
                { name: "Husky (Git hooks)", value: "husky" },
                { name: "Commitlint (Conventional commits)", value: "commitlint" },
            ],
        });
    }
    // Step 9: Package Manager
    let packageManager;
    if (existing.packageManager !== undefined) {
        packageManager = existing.packageManager;
    }
    else {
        packageManager = await select({
            message: "Choose a package manager",
            choices: [
                { name: "npm", value: "npm" },
                { name: "pnpm", value: "pnpm" },
                { name: "Yarn", value: "yarn" },
                { name: "Bun", value: "bun" },
            ],
            default: "npm",
        });
    }
    return {
        projectName,
        framework,
        typeScript,
        database,
        auth,
        uiLibrary,
        tools,
        packageManager,
    };
};
//# sourceMappingURL=project.js.map