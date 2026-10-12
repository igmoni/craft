# Craft

**Craft is a TypeScript CLI that scaffolds web development projects and configures common development tools.**

Instead of manually setting up a project and its tooling every time, use Craft to generate a project, choose a database and authentication provider, and configure selected tools.

> Craft is under active development. Check the supported options and limitations below before using it for a real project.

## Features

- Interactive project setup.
- Framework scaffolding for **Next.js**, **Vite**, and **Express**.
- TypeScript or JavaScript selection.
- Optional PostgreSQL or MongoDB configuration.
- Optional authentication package setup with Better Auth, Auth.js, or Clerk, subject to framework support.
- Optional ESLint, Prettier, Husky, and Commitlint setup.
- Environment template generation and creation of a local `.env` file when an `.env.example` is generated.
- Staging directory for project generation.
- Conflict checks intended to avoid overwriting existing files.
- CLI options and help output through Commander.

## Requirements

- Node.js and npm
- Internet access when scaffolding frameworks and installing dependencies

## Development setup

Clone the repository and install its dependencies:

```bash
git clone https://github.com/igmoni/craft.git
cd craft
npm install
npm run build
```

Link the CLI locally so you can run `craft` from your terminal:

```bash
npm link
craft --help
```

This is the local development setup. Install from npm only after Craft has been published.

## Usage

### Interactive setup

```bash
craft init
```

Provide a project name when prompted, or pass it directly:

```bash
craft init my-app
```

### Choose a framework

```bash
craft init my-app --framework next
craft init my-app --framework vite
craft init my-api --framework express
```

Supported framework values:

- `next`
- `vite`
- `express`

### Choose TypeScript or JavaScript

```bash
craft init my-app --ts
craft init my-app --js
```

### Choose a database

```bash
craft init my-app --database postgres
craft init my-app --database mongodb
craft init my-app --database none
```

Supported database values:

- `postgres`
- `mongodb`
- `none`

### Configure authentication

```bash
craft init my-app --auth
craft init my-app --auth better-auth
craft init my-app --auth authjs
craft init my-app --auth clerk
```

Supported providers:

- `better-auth`
- `authjs` — Next.js only
- `clerk`

Craft installs the relevant provider package where supported and generates environment/setup guidance. **Selecting an authentication provider does not mean a complete sign-up/login flow has been implemented automatically.** Follow the generated `AUTH_SETUP.md` and the provider's official documentation to finish setup.

### Choose development tools

Use a comma-separated list:

```bash
craft init my-app --tools eslint,prettier
craft init my-app --tools eslint,prettier,husky,commitlint
```

Supported tools:

- `eslint`
- `prettier`
- `husky`
- `commitlint`

### Combine options

```bash
craft init my-app --framework vite --database none --js --tools eslint,prettier
craft init my-api --framework express --database postgres --ts
craft init my-app --framework next --database postgres --auth better-auth --ts
```

### Help

```bash
craft --help
craft init --help
craft --version
```

## Environment files and credentials

When a generator creates `.env.example`, Craft can create a local `.env` from that template if one does not already exist.

- `.env.example` is a template and can be committed.
- `.env` is for local values and secrets; do **not** commit it.
- Replace placeholder database URLs and provider keys with your own values.
- Craft cannot create real database credentials or third-party provider keys for you.
- Keep `.env` ignored by Git.

For database setup, ensure the database server or hosted database is available and the connection string in `.env` is correct.

## Project generation and file safety

Craft generates framework files in a temporary staging directory before merging them into the target project. It checks for file conflicts and uses exclusive file creation to avoid silently replacing existing files during the merge.

For an existing target directory, Craft may ask for confirmation before continuing. Review the generated output and keep a backup of important project files.

## Development commands

From the Craft repository:

```bash
npm run build
npm run format
npm run format:check
```

The format commands depend on the scripts configured in the repository's `package.json`.

## Current scope and limitations

- The currently supported frameworks are Next.js, Vite, and Express.
- The currently supported database choices are PostgreSQL, MongoDB, or none.
- Authentication setup installs a provider package and provides setup guidance; it does not automatically implement every provider's complete authentication flow.
- Database configuration requires valid credentials and an accessible database to connect successfully.
- Craft currently installs generated project dependencies using npm.
- Additional frameworks, package managers, and integrations can be added in future releases.
- Back navigation to previous interactive prompts is not currently supported.

## Contributing

Craft is actively being developed. Issues, bug reports, and pull requests are welcome. Include reproduction steps and relevant command output when reporting a bug.

## License

Craft is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

MIT License

Copyright (c) 2026 Mohan S P

Permission is hereby granted, free of charge...
