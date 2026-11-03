export const GENERATOR_STEPS = [
    {
        id: "validate",
        name: "Validating configuration",
        description: "Ensuring options and target directories are valid",
    },
    {
        id: "staging",
        name: "Preparing workspace",
        description: "Creating an isolated staging directory",
    },
    {
        id: "scaffold",
        name: "Scaffolding framework",
        description: "Generating base project files",
    },
    {
        id: "tailwind",
        name: "Configuring Tailwind CSS",
        description: "Setting up styling and utility classes",
    },
    {
        id: "database",
        name: "Configuring database",
        description: "Generating database client and schema files",
    },
    {
        id: "auth",
        name: "Configuring authentication",
        description: "Setting up authentication handlers and keys",
    },
    {
        id: "tools",
        name: "Configuring development tools",
        description: "Setting up linter, formatter, and git hooks",
    },
    {
        id: "env",
        name: "Configuring environment files",
        description: "Creating .env.example and .env templates",
    },
    {
        id: "merge",
        name: "Finalizing project files",
        description: "Merging staged files safely into destination",
    },
    {
        id: "install",
        name: "Installing dependencies",
        description: "Running package manager install",
    },
    {
        id: "post-install",
        name: "Running post-install setup",
        description: "Initializing UI components and client generation",
    },
    {
        id: "complete",
        name: "Complete",
        description: "Project ready to build",
    },
];
//# sourceMappingURL=pipeline.js.map