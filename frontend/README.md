# Hoossh Lead Growth CRM - Frontend

This project is the frontend for the Hoossh Lead Growth CRM application. It is built with React, TypeScript, Tailwind CSS, and Vite to provide a fast development experience with hot module replacement (HMR) and modern build tooling.

## Features

- React 18+ with functional components and hooks
- TypeScript support for type-safe development
- Vite for fast build and development server
- ESLint / Oxlint support for code quality
- Optimized build output for production

## Project structure

- `src/` - application source code
- `src/main.tsx` - application entry point
- `src/App.tsx` - main application component
- `src/index.css` - global styles
- `public/` - static assets
- `vite.config.ts` - Vite configuration

## Requirements

- Node.js 18 or later
- npm, Yarn, or pnpm

## Installation

1. Open a terminal in the `frontend` folder.
2. Install dependencies:

```bash
npm install
```

or

```bash
yarn install
```

## Available scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run linter checks (if configured)

## Running locally

Start the development server and open the app in your browser:

```bash
npm run dev
```

The default URL is usually `http://localhost:5173`.

## Building for production

Create an optimized production bundle:

```bash
npm run build
```

Preview the built application locally:

```bash
npm run preview
```

## Linting and code style

This template can use Rust-based Oxc / Oxlint or regular ESLint configuration. To enable type-aware linting with Oxlint, add or update `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

## Notes

- If you want to use the React compiler, follow the official React Compiler installation guide.
- Adjust linting and formatting rules to match your team preferences.

## License

This project is available under the terms of your chosen license.


