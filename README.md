# Craft

<p align="center">
  <img src="https://img.shields.io/badge/CRAFT-2563EB?style=for-the-badge&labelColor=2563EB" alt="CRAFT" />
</p>

<p align="center">
  <strong>Stop setting up. Start building.</strong>
</p>

<p align="center">
  A developer-focused project scaffolding CLI for modern frontend, backend, and full-stack applications.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@igmoni/craft">
    <img src="https://img.shields.io/npm/v/@igmoni/craft?color=2563EB&label=npm" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@igmoni/craft">
    <img src="https://img.shields.io/npm/dm/@igmoni/craft" alt="npm downloads" />
  </a>
  <a href="https://github.com/igmoni/craft/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/igmoni/craft" alt="License" />
  </a>
</p>

---

## What is Craft?

**Craft** is a developer-focused CLI that helps you scaffold modern applications without spending time configuring the same boilerplate repeatedly.

Choose your framework, language, database, authentication provider, UI library, development tools, and package manager. Craft handles the setup and generates a structured project ready for development.

Whether you're building a frontend application, backend API, or full-stack product, Craft helps you get started faster.

**Less configuration. More building.**

## Features

- **8 Supported Frameworks** — Scaffold frontend, backend, and full-stack applications.
- **Interactive CLI** — Guided terminal experience with framework categories and capability-aware options.
- **Non-Interactive Mode** — Generate projects using CLI flags for faster workflows and automation.
- **TypeScript & JavaScript** — Choose your preferred language where supported.
- **Database Integration** — Configure PostgreSQL with Prisma or MongoDB with Mongoose.
- **Authentication Integration** — Set up Better Auth, Auth.js, or Clerk where supported.
- **Tailwind CSS** — Configure Tailwind CSS v4 for supported frameworks.
- **shadcn/ui** — Initialize shadcn/ui for React (Vite) and Next.js.
- **Development Tools** — Configure ESLint, Prettier, Husky, and Commitlint.
- **Multiple Package Managers** — npm, pnpm, yarn, and bun where supported.
- **Centralized Framework Registry** — Framework capabilities and compatibility are managed centrally.
- **Safe Project Generation** — Uses temporary staging directories and safe file merging to protect existing files.

---

## Supported Frameworks

Craft currently supports eight frameworks across three categories.

| Framework    | Category   | TypeScript | JavaScript | Database            | Authentication              | Tailwind | shadcn/ui |
| ------------ | ---------- | :--------: | :--------: | ------------------- | --------------------------- | :------: | :-------: |
| Angular      | Frontend   |    Yes     |     No     | —                   | —                           |   Yes    |     —     |
| Vue          | Frontend   |    Yes     |    Yes     | —                   | —                           |   Yes    |     —     |
| React (Vite) | Frontend   |    Yes     |    Yes     | —                   | Better Auth, Clerk          |   Yes    |    Yes    |
| NestJS       | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | —                           |    —     |     —     |
| Express      | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | Better Auth, Clerk          |    —     |     —     |
| Fastify      | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | —                           |    —     |     —     |
| Hono         | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | —                           |    —     |     —     |
| Next.js      | Full-stack |    Yes     |    Yes     | PostgreSQL, MongoDB | Better Auth, Auth.js, Clerk |   Yes    |    Yes    |

> Craft automatically filters available options based on framework capabilities. Unsupported combinations are not offered.

---

## Installation

### Requirements

Before using Craft, make sure you have:

- [Node.js](https://nodejs.org/) installed.
- npm installed (included with Node.js).
- A supported package manager if you want to use pnpm, yarn, or bun.

### Option 1: Run with npx

No global installation required.

```bash
npx @igmoni/craft
```

### Option 2: Install globally

```bash
npm install -g @igmoni/craft
```

Then run:

```bash
craft init
```

To check the installed version:

```bash
craft --version
```

---

## Getting Started

### 1. Launch Craft

```bash
craft init
```

Craft opens an interactive terminal experience.

### 2. Choose your project name

Enter your project name.

For example:

```text
my-saas-app
```

You can also enter `.` to scaffold into the current directory.

If the current directory contains existing files, Craft asks for confirmation before proceeding.

### 3. Select a category

Choose the type of application you want to build:

- Frontend
- Backend
- Full-stack

### 4. Select a framework

Craft displays the frameworks available in your selected category.

For example:

```text
Frontend
  Angular
  Vue
  React (Vite)

Backend
  NestJS
  Express
  Fastify
  Hono

Full-stack
  Next.js
```

### 5. Choose a language

Choose between:

- TypeScript
- JavaScript

Language options depend on framework support. Angular uses TypeScript.

### 6. Configure your database

For supported backend and full-stack frameworks, choose:

- PostgreSQL (Prisma)
- MongoDB (Mongoose)
- None

### 7. Configure authentication

Choose an available authentication provider:

- Better Auth
- Auth.js
- Clerk
- None

Available providers depend on the selected framework.

### 8. Configure styling

For supported frameworks, choose whether to include Tailwind CSS.

### 9. Choose a UI library

For React (Vite) and Next.js, you can initialize shadcn/ui.

### 10. Select development tools

Choose any combination of:

- ESLint
- Prettier
- Husky
- Commitlint

### 11. Select your package manager

Choose:

- npm
- pnpm
- yarn
- bun

Craft checks package manager availability and filters unsupported choices.

### 12. Start building

Once configuration is complete, Craft generates your project, installs dependencies, and runs applicable post-install setup.

Navigate into your project:

```bash
cd my-saas-app
```

Start development using the generated project's scripts.

---

## Non-Interactive Mode

Craft also supports command-line arguments, allowing you to generate projects without going through interactive prompts.

This is useful for developers who prefer direct configuration or want to automate project creation.

### Example 1: Next.js SaaS Application

Generate a Next.js project with PostgreSQL, Better Auth, shadcn/ui, and development tools.

```bash
craft init my-saas-app \
  --framework next \
  --ts \
  --database postgres \
  --auth better-auth \
  --shadcn \
  --tools eslint,prettier,husky \
  --package-manager pnpm
```

### Example 2: Express Backend API

Generate an Express API with MongoDB and Clerk.

```bash
craft init my-api \
  --framework express \
  --ts \
  --database mongodb \
  --auth clerk \
  --tools eslint,prettier \
  --package-manager npm
```

### Example 3: React Application

Generate a React application with Tailwind CSS and shadcn/ui.

```bash
craft init client-app \
  --framework react \
  --ts \
  --shadcn \
  --tools eslint,prettier \
  --package-manager bun
```

### Example 4: NestJS Backend

Generate a NestJS application with PostgreSQL and Prisma.

```bash
craft init my-server \
  --framework nestjs \
  --ts \
  --database postgres \
  --tools eslint,prettier \
  --package-manager pnpm
```

### Example 5: Vue Application

Generate a Vue application with TypeScript and Tailwind CSS.

```bash
craft init my-dashboard \
  --framework vue \
  --ts \
  --tailwind \
  --tools eslint,prettier \
  --package-manager npm
```

---

## CLI Reference

### Available Commands

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `craft`           | Launch the CLI                         |
| `craft init`      | Start project generation               |
| `craft --help`    | Display available commands and options |
| `craft --version` | Display the installed version          |

### Available Flags

| Flag                         | Description              | Values                                                                    |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `-f, --framework <name>`     | Select framework         | `angular`, `vue`, `react`, `nestjs`, `express`, `fastify`, `hono`, `next` |
| `--ts`                       | Use TypeScript           | —                                                                         |
| `--js`                       | Use JavaScript           | —                                                                         |
| `-d, --database <db>`        | Configure database       | `postgres`, `mongodb`, `none`                                             |
| `--auth <provider>`          | Configure authentication | `better-auth`, `authjs`, `clerk`, `none`                                  |
| `--tailwind`                 | Enable Tailwind CSS      | —                                                                         |
| `--no-tailwind`              | Disable Tailwind CSS     | —                                                                         |
| `--shadcn`                   | Enable shadcn/ui         | —                                                                         |
| `--no-shadcn`                | Disable shadcn/ui        | —                                                                         |
| `-t, --tools <tools>`        | Select development tools | `eslint`, `prettier`, `husky`, `commitlint`                               |
| `-p, --package-manager <pm>` | Select package manager   | `npm`, `pnpm`, `yarn`, `bun`                                              |
| `-v, --version`              | Display CLI version      | —                                                                         |
| `-h, --help`                 | Display help             | —                                                                         |

Tools can be supplied as a comma-separated list:

```bash
craft init my-app --framework next --tools eslint,prettier,husky
```

### Package Manager Compatibility

Craft supports:

- npm
- pnpm
- yarn
- bun

Some framework generators have their own package-manager restrictions. For example, NestJS does not support bun in the current Craft configuration.

---

## Database Integrations

Craft can configure database integrations during project generation.

### PostgreSQL with Prisma

When PostgreSQL is selected, Craft:

- Installs Prisma and `@prisma/client`.
- Generates a Prisma schema.
- Configures the PostgreSQL datasource using `DATABASE_URL`.
- Creates a reusable database client with connection caching where applicable.
- Adds database management scripts.
- Generates `.env.example` and an initial `.env` file with placeholder credentials.

#### Generated Database Scripts

| Script        | Description                 |
| ------------- | --------------------------- |
| `db:generate` | Generate Prisma Client      |
| `db:migrate`  | Run development migrations  |
| `db:deploy`   | Apply production migrations |
| `db:studio`   | Open Prisma Studio          |

#### Getting Started with PostgreSQL

1. Create a PostgreSQL database.
2. Open your generated `.env` file.
3. Configure `DATABASE_URL` with your database connection string.
4. Generate the Prisma client if required.
5. Run the development migration.

```bash
npm run db:generate
npm run db:migrate
```

You can inspect your database using:

```bash
npm run db:studio
```

### MongoDB with Mongoose

When MongoDB is selected, Craft:

- Installs Mongoose and dotenv.
- Generates a reusable database connection module.
- Adds connection caching and graceful shutdown helpers where applicable.
- Creates `.env.example` and `.env` files.
- Configures `MONGODB_URI`.

#### Getting Started with MongoDB

1. Create a MongoDB database.
2. Open your generated `.env` file.
3. Configure your connection string.

```env
MONGODB_URI=mongodb://localhost:27017/myapp
```

4. Start your application.

---

## Authentication Integrations

Craft supports authentication setup for compatible frameworks.

Each integration generates the relevant configuration files and an `AUTH_SETUP.md` guide with provider-specific setup instructions.

### Better Auth

Supported frameworks:

- Next.js
- React (Vite)
- Express

Generated configurations include the relevant server or client authentication instances, API handlers, and integration setup.

### Auth.js

Supported framework:

- Next.js

Craft generates:

- Core authentication initialization.
- App Router authentication handlers.
- Route protection middleware.

### Clerk

Supported frameworks:

- Next.js
- React (Vite)
- Express

Depending on the framework, Craft generates the relevant provider configuration, middleware, or authentication wrapper.

### Important

Authentication providers require external configuration.

After generation:

1. Open `AUTH_SETUP.md`.
2. Follow the provider setup instructions.
3. Create the required provider credentials.
4. Add the credentials to your `.env` file.
5. Start your application.

---

## Tailwind CSS & shadcn/ui

### Tailwind CSS

Craft configures Tailwind CSS v4 for supported frameworks:

- Angular
- Vue
- React (Vite)
- Next.js

The configuration is integrated into the generated project.

### shadcn/ui

Craft supports shadcn/ui initialization for:

- React (Vite)
- Next.js

When selected, Craft initializes the official shadcn CLI and generates the initial configuration and components.

For React (Vite), Craft also configures the required `@/*` import alias.

After generation, you can add components using the shadcn CLI:

```bash
npx shadcn@latest add button
```

For more components and documentation, visit:

https://ui.shadcn.com/

---

## Development Tools

Craft can configure commonly used development tools during project generation.

### ESLint

Provides a modern flat configuration for linting JavaScript and TypeScript projects.

Run:

```bash
npm run lint
```

### Prettier

Configures Prettier with formatting support and applicable import and Tailwind class sorting plugins.

Run:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

### Husky

Configures Git hooks for automated checks.

### Commitlint

Configures conventional commit message validation using Commitlint.

> Husky hooks require an initialized Git repository. If you generated a project without one, initialize it before relying on Git hooks.

```bash
git init
npm run prepare
```

---

## Project Generation & Safety

Craft uses a staging-based generation workflow.

Instead of generating files directly into your destination directory, Craft:

1. Validates the selected configuration.
2. Prepares an isolated temporary workspace.
3. Scaffolds the selected framework.
4. Configures selected integrations.
5. Safely merges generated files into the destination.
6. Installs dependencies.
7. Runs applicable post-install setup.
8. Cleans up temporary staging files.

This approach helps protect existing project files and prevents unnecessary overwrites.

If a post-install step fails after the files have been merged, Craft preserves the generated project and provides the location and failed command so you can finish setup manually.

---

## Troubleshooting

### Package manager not found

If Craft cannot find your selected package manager, install it or select another available package manager.

Install pnpm:

```bash
npm install -g pnpm
```

Install yarn:

```bash
npm install -g yarn
```

Install bun:

```bash
npm install -g bun
```

### Database connection errors

Check that your database service is running and that your `.env` file contains valid credentials.

For PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

For MongoDB:

```env
MONGODB_URI="mongodb://localhost:27017/mydb"
```

### Authentication not working

Open the generated `AUTH_SETUP.md` file and verify that:

- Your provider account is configured.
- Required API keys are present.
- Environment variables are correct.
- Callback URLs and provider settings match your application.

### Git hooks are not running

Make sure Git is initialized:

```bash
git init
npm run prepare
```

### A post-install integration fails

Craft preserves your generated project when a later setup step fails.

Read the error message carefully, navigate to the preserved project directory, and run the failed command manually after checking the generated configuration.

---

## Development & Testing

Want to contribute to Craft or work on its source code?

### Clone the repository

```bash
git clone https://github.com/igmoni/craft.git

cd craft

npm install
```

### Run unit tests

```bash
npm test
```

### Run TypeScript checks

```bash
npm run typecheck
```

### Check formatting

```bash
npm run format:check
```

### Format source files

```bash
npm run format
```

### Build Craft

```bash
npm run build
```

### Run generator integration tests

```bash
npm run test:generators
```

The integration test runner generates real projects and verifies their structure, integrations, and applicable builds.

#### Test specific frameworks

```bash
npm run test:generators -- -- --framework react
```

#### Test advanced integrations

```bash
npm run test:generators -- -- --with-integrations
```

#### Skip build verification

```bash
npm run test:generators -- -- --skip-build
```

#### Preserve temporary test workspaces

```bash
npm run test:generators -- -- --keep-temp
```

### Link Craft locally

To test your local CLI build:

```bash
npm link
```

Then:

```bash
craft --help
craft init
```

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

If you find a bug or have an idea that could improve Craft:

1. Open an issue describing the problem or feature.
2. Fork the repository.
3. Create a branch for your changes.
4. Make your changes and add relevant tests.
5. Run the test suite.
6. Submit a pull request.

GitHub repository:

https://github.com/igmoni/craft

Report bugs and request features:

https://github.com/igmoni/craft/issues

---

## Roadmap

Craft aims to make project setup faster, more consistent, and more developer-friendly.

Future improvements may include:

- More framework integrations.
- Improved project templates.
- Additional development tooling.
- Production-ready starter templates.
- More customization options.

---

## License

Craft is open-source software licensed under the MIT License.

Copyright © Mohan S P.

---

<p align="center">
  <strong>Craft</strong>
  <br />
  Stop setting up. Start building.
  <br /><br />
  Built for developers, by a developer.
</p>
