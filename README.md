# Craft

```text
   ██████╗██████╗  █████╗ ███████╗████████╗
  ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝
  ██║     ██████╔╝███████║█████╗     ██║
  ██║     ██╔══██╗██╔══██║██╔══╝     ██║
  ╚██████╗██║  ██║██║  ██║██║        ██║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝

  Stop setting up. Start building.
```

**Craft** is a developer-focused CLI that scaffolds modern full-stack, frontend, and backend projects configured with your choice of framework, language, database, authentication provider, UI library, and development tools.

Zero manual boilerplate. Clean, production-ready code in seconds.

---

## Quick Start

Generate a new project interactively:

```bash
npx @igmoni/craft
```

Or install globally:

```bash
npm install -g @igmoni/craft
craft init
```

---

## Features

- **Interactive & Non-Interactive Scaffolding**: Fast terminal UI with category filtering, capability checks, and full CLI flag support.
- **8 Supported Frameworks**: Official generators and templates for Frontend, Backend, and Full-stack architectures.
- **TypeScript & JavaScript**: Full language awareness, respecting framework-specific capabilities.
- **Database Integration**: Turnkey PostgreSQL (via Prisma) or MongoDB (via Mongoose) with connection management, environment templates, and scripts.
- **Authentication Handlers**: Ready-to-use configurations for Better Auth, Auth.js, and Clerk with client/server separation, middleware, and route handlers.
- **Tailwind CSS & shadcn/ui**: Tailwind v4 styling and official shadcn component setup.
- **Developer Tooling**: Preconfigured ESLint (flat config), Prettier (with import & Tailwind sorting), Husky, and Commitlint.
- **Multi-Package Manager**: Full support for `npm`, `pnpm`, `yarn`, and `bun` with environment detection.
- **Safe Staging Engine**: Staged file creation with strict conflict prevention, atomic directory merging, and rollback protection.

---

## Supported Frameworks

Craft enforces a centralized framework capability registry to ensure only compatible options are displayed and scaffolded.

| Framework        | Category   | TypeScript | JavaScript |      Database       | Auth Providers              | Tailwind | shadcn/ui |
| :--------------- | :--------- | :--------: | :--------: | :-----------------: | :-------------------------- | :------: | :-------: |
| **Angular**      | Frontend   |    Yes     |     No     |        None         | None                        |   Yes    |    No     |
| **Vue**          | Frontend   |    Yes     |    Yes     |        None         | None                        |   Yes    |    No     |
| **React (Vite)** | Frontend   |    Yes     |    Yes     |        None         | Better Auth, Clerk          |   Yes    |    Yes    |
| **NestJS**       | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | None                        |    No    |    No     |
| **Express**      | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | Better Auth, Clerk          |    No    |    No     |
| **Fastify**      | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | None                        |    No    |    No     |
| **Hono**         | Backend    |    Yes     |    Yes     | PostgreSQL, MongoDB | None                        |    No    |    No     |
| **Next.js**      | Full-stack |    Yes     |    Yes     | PostgreSQL, MongoDB | Better Auth, Auth.js, Clerk |   Yes    |    Yes    |

---

## Usage

### Interactive Mode

Simply run `craft` or `craft init`:

```bash
craft init
```

Craft will guide you step-by-step:

1. **Project Name** — Target directory or `.` for current directory
2. **Category** — Frontend, Backend, or Full-stack
3. **Framework** — Filtered dynamically by category
4. **Language** — TypeScript or JavaScript (skipped for TypeScript-only frameworks like Angular)
5. **Database** — PostgreSQL (Prisma), MongoDB (Mongoose), or None (only prompted for supported backend/full-stack frameworks)
6. **Authentication** — Provider options filtered to framework support
7. **UI Library** — Option to add shadcn/ui (React Vite & Next.js)
8. **Development Tools** — Multi-select ESLint, Prettier, Husky, Commitlint
9. **Package Manager** — npm, pnpm, yarn, bun

### Non-Interactive (CLI Flags) Mode

You can supply arguments directly to bypass prompts or automate CI/CD:

```bash
# Next.js Fullstack with Prisma, Better Auth, shadcn/ui
craft init my-app \
  --framework next \
  --ts \
  --database postgres \
  --auth better-auth \
  --shadcn \
  --tools eslint,prettier,husky \
  --package-manager pnpm

# Express API with MongoDB and Clerk
craft init my-api \
  --framework express \
  --ts \
  --database mongodb \
  --auth clerk \
  --tools eslint,prettier \
  --package-manager npm

# React (Vite) with Tailwind and shadcn/ui
craft init client-app \
  --framework react \
  --ts \
  --shadcn \
  --tools eslint,prettier \
  --package-manager bun
```

#### Available CLI Options

| Flag                         | Description               | Options                                                                   |
| :--------------------------- | :------------------------ | :------------------------------------------------------------------------ |
| `-f, --framework <name>`     | Target framework          | `angular`, `vue`, `react`, `nestjs`, `express`, `fastify`, `hono`, `next` |
| `--ts`                       | Use TypeScript            |                                                                           |
| `--js`                       | Use JavaScript            |                                                                           |
| `-d, --database <db>`        | Database integration      | `postgres`, `mongodb`, `none`                                             |
| `--auth <provider>`          | Authentication provider   | `better-auth`, `authjs`, `clerk`, `none`                                  |
| `--shadcn`                   | Add shadcn/ui integration |                                                                           |
| `--no-shadcn`                | Skip shadcn/ui            |                                                                           |
| `-t, --tools <tools>`        | Comma-separated dev tools | `eslint`, `prettier`, `husky`, `commitlint`                               |
| `-p, --package-manager <pm>` | Preferred package manager | `npm`, `pnpm`, `yarn`, `bun`                                              |
| `-v, --version`              | Output CLI version        |                                                                           |
| `-h, --help`                 | Display command help      |                                                                           |

---

## Database Integrations

### PostgreSQL (Prisma)

When PostgreSQL is selected, Craft:

- Adds `@prisma/client` and `prisma` CLI.
- Generates `prisma/schema.prisma` with a PostgreSQL datasource configured to `env("DATABASE_URL")` and an initial schema model.
- Generates a cached database client (`src/lib/db.ts` or `src/db.ts` for TypeScript, `db.js` for JavaScript) to prevent connection leaks during hot reloading.
- Adds ready-to-run database scripts:
  - `db:generate`: Generate Prisma Client
  - `db:migrate`: Run migrations in development
  - `db:deploy`: Apply production migrations
  - `db:studio`: Launch Prisma Studio UI
- Creates `.env.example` and a local `.env` with placeholder credentials.

### MongoDB (Mongoose)

When MongoDB is selected, Craft:

- Adds `mongoose` and `dotenv`.
- Generates a reusable connection module (`db.ts` or `db.js`) with connection caching, buffer handling, and graceful shutdown helpers.
- Creates `.env.example` and local `.env` with `MONGODB_URI`.

---

## Authentication Integrations

Craft generates real server handlers, client instances, middleware, and setup documentation:

### Better Auth

- **Next.js**: Server instance (`src/lib/auth.ts`), client instance (`src/lib/auth-client.ts`), and App Router API route handler (`src/app/api/auth/[...all]/route.ts`).
- **React (Vite)**: Client auth instance (`src/lib/auth-client.ts`) preconfigured with `createAuthClient`.
- **Express**: Server instance (`src/auth.ts`) mounted with `toNodeHandler(auth)` before `express.json()` to preserve raw body streams.

### Auth.js (NextAuth v5)

- **Next.js**: Core initialization (`src/auth.ts`), App Router route handler (`src/app/api/auth/[...nextauth]/route.ts`), and route protection middleware (`src/middleware.ts`).

### Clerk

- **Next.js**: Edge-compatible `clerkMiddleware()` (`src/middleware.ts`) and environment key templates.
- **React (Vite)**: `<AuthProvider>` wrapper component with `<ClerkProvider>` and environment configuration.
- **Express**: Integrated `clerkMiddleware()` applied to Express application.

Every authentication setup generates an `AUTH_SETUP.md` guide explaining provider dashboard setup, credentials, and next steps.

---

## Development Tools

Craft can configure standard developer tooling during project scaffolding:

- **ESLint**: Modern flat configuration (`eslint.config.mjs`) supporting TypeScript and JavaScript with `npm run lint`.
- **Prettier**: Formatter configured via `.prettierrc.json` with `@trivago/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`, plus `.prettierignore`, `npm run format`, and `npm run format:check`.
- **Husky**: Git hook manager with `prepare` script and `.husky/pre-commit` running lint and format checks.
- **Commitlint**: Enforces conventional commit messages via `.husky/commit-msg` and `commitlint.config.mjs`.

---

## Troubleshooting

### Package manager not recognized

If Craft warns that your package manager is not installed, install it or choose another one:

```bash
npm install -g pnpm
# or
npm install -g yarn
# or
curl -fsSL https://bun.sh/install | bash
```

### Git hooks in fresh repositories

Husky hooks require an initialized Git repository. If you scaffolded into a directory that is not yet a git repository:

```bash
git init
npm run prepare
```

### Database connection errors

Make sure your PostgreSQL or MongoDB service is running and update `DATABASE_URL` or `MONGODB_URI` in `.env` with your actual credentials before running migrations.

---

## Development & Testing

Clone the repository and install dependencies:

```bash
git clone https://github.com/igmoni/craft.git
cd craft
npm install
```

Run test suite:

```bash
npm test
```

Run typecheck:

```bash
npm run typecheck
```

Format code:

```bash
npm run format
npm run format:check
```

Build the CLI:

```bash
npm run build
```

Link locally for development testing:

```bash
npm link
craft --help
```

---

## License

MIT © [Mohan S P](https://github.com/igmoni)
