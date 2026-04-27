# Tasks — frontend-shell

## Overview

Tasks are ordered for sequential execution. Each task builds on the previous. Complete tasks in order to avoid broken intermediate states.

---

- [ ] 1. Create `client/package.json` with frontend scripts and ESLint devDependencies
  - [ ] 1.1 Create `client/package.json` with `name: "jarvis-client"`, `private: true`, `type: "module"`
  - [ ] 1.2 Add scripts: `dev` (vite), `build` (vite build), `typecheck` (tsc --noEmit), `lint` (eslint . --max-warnings 0), `test` (vitest run)
  - [ ] 1.3 Add devDependencies for ESLint: `eslint ^9.x`, `@typescript-eslint/eslint-plugin ^8.x`, `@typescript-eslint/parser ^8.x`, `eslint-plugin-react-hooks ^5.x`, `globals ^15.x`
  - [ ] 1.4 Run `npm install` from `client/` to install the new devDependencies

- [ ] 2. Create `client/tsconfig.json`
  - [ ] 2.1 Set `target: "ES2020"`, `lib: ["ES2020", "DOM", "DOM.Iterable"]`
  - [ ] 2.2 Set `module: "ESNext"`, `moduleResolution: "bundler"`
  - [ ] 2.3 Set `jsx: "react-jsx"`, `strict: true`, `noEmit: true`, `skipLibCheck: true`
  - [ ] 2.4 Set `baseUrl: "."` and `paths: { "@/*": ["./src/*"] }`
  - [ ] 2.5 Set `include: ["src"]`

- [ ] 3. Create `client/vite.config.ts`
  - [ ] 3.1 Import `defineConfig` from `vite`, `react` from `@vitejs/plugin-react`, `tailwindcss` from `@tailwindcss/vite`, and `path` from `node:path`
  - [ ] 3.2 Register `react()` and `tailwindcss()` in the `plugins` array
  - [ ] 3.3 Define `resolve.alias` mapping `"@"` to `path.resolve(__dirname, "./src")`
  - [ ] 3.4 Verify `client/src/index.css` exists and contains Tailwind CSS directives (`@import "tailwindcss"` or equivalent for Tailwind v4)

- [ ] 4. Create `client/eslint.config.js`
  - [ ] 4.1 Use ESLint v9 flat-config format with `import globals from "globals"`
  - [ ] 4.2 Add a config object for TypeScript files using `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`
  - [ ] 4.3 Extend `@typescript-eslint/recommended` rules
  - [ ] 4.4 Add `eslint-plugin-react-hooks` and enable `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` rules
  - [ ] 4.5 Set `ignores` to exclude `node_modules/`, `dist/`, and `*.config.*`

- [ ] 5. Verify and update `client/.env.example`
  - [ ] 5.1 Confirm `VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX` is present
  - [ ] 5.2 Confirm `VITE_AWS_COGNITO_CLIENT_ID=your-cognito-client-id` is present
  - [ ] 5.3 Confirm `VITE_WEBHOOK_URL=http://your-ec2-ip:5678/webhook/tasks` is present
  - [ ] 5.4 Confirm no real credentials or real endpoint URLs are present

- [ ] 6. Create `client/src/pages/DashboardPage.tsx`
  - [ ] 6.1 Create a default-exported React component named `DashboardPage`
  - [ ] 6.2 Render a heading (e.g., `<h1>Dashboard</h1>`) and a paragraph indicating the workspace is ready
  - [ ] 6.3 Do NOT import any cognitive feature components (Focus Queue, Zen Mode, Cognitive Guardian, thought ingestion)
  - [ ] 6.4 Apply Tailwind CSS classes consistent with the existing slate color palette

- [ ] 7. Create `client/src/App.tsx`
  - [ ] 7.1 Import `Switch`, `Route`, `Redirect` from `wouter`
  - [ ] 7.2 Import `LoginPage`, `DashboardPage`, `ProtectedRoute`, `DashboardLayout`
  - [ ] 7.3 Define a `<Switch>` with:
    - `<Route path="/login">` → `<LoginPage />`
    - `<Route path="/dashboard">` → `<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>`
    - Catch-all `<Route>` → `<Redirect to="/dashboard" />`
  - [ ] 7.4 Export `App` as the default export

- [ ] 8. Create `client/src/main.tsx`
  - [ ] 8.1 Import `React`, `ReactDOM`, `AuthProvider`, `QueryClient`, `QueryClientProvider`, `Toaster`, and `App`
  - [ ] 8.2 Instantiate `QueryClient` with `defaultOptions: { queries: { staleTime: 0, retry: 1 } }`
  - [ ] 8.3 Add a startup validation block that logs a `console.warn` for each missing `VITE_` variable (`VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID`, `VITE_WEBHOOK_URL`)
  - [ ] 8.4 Mount `<React.StrictMode><AuthProvider><QueryClientProvider client={queryClient}><Toaster /><App /></QueryClientProvider></AuthProvider></React.StrictMode>` on `document.getElementById("root")`
  - [ ] 8.5 Import `./index.css` before the React root mount

- [ ] 9. Create `docs/adr/001-custom-cognito-auth.md`
  - [ ] 9.1 Create the `docs/adr/` directory if it does not exist
  - [ ] 9.2 Write the ADR with sections: Title, Status (Accepted), Context, Decision, Consequences
  - [ ] 9.3 Context: steering specifies `@aws-amplify/ui-react`; existing code uses `amazon-cognito-identity-js` directly
  - [ ] 9.4 Decision: retain custom hook approach for full control over Cognito flow and JWT extraction
  - [ ] 9.5 Consequences: steering file remains aspirational; future migration requires a new ADR

- [ ] 10. Write correctness tests in `client/src/__tests__/`
  - [ ] 10.1 Create `client/src/__tests__/` directory and a `vitest.config.ts` (or extend root config) pointing to `client/src`
  - [ ] 10.2 Install `@testing-library/react`, `@testing-library/jest-dom`, and `fast-check` as devDependencies in `client/package.json`
  - [ ] 10.3 Write property test: unauthenticated access to any path renders a redirect to `/login` (use `fast-check` to generate arbitrary paths)
  - [ ] 10.4 Write property test: after `logout()` from any prior auth state, `isAuthenticated` is `false` and `user` is `null`
  - [ ] 10.5 Write example test: `QueryClientProvider` is present in the rendered `App` tree
  - [ ] 10.6 Write example test: `client/.env.example` contains all three required `VITE_` variable keys
  - [ ] 10.7 Write example test: authenticated user at `/login` is redirected to `/dashboard`

- [ ] 11. Verify the complete shell
  - [ ] 11.1 Run `npm run --prefix client typecheck` — expect zero TypeScript errors
  - [ ] 11.2 Run `npm run --prefix client lint` — expect zero ESLint errors
  - [ ] 11.3 Run `npm run --prefix client test` — expect all tests pass
  - [ ] 11.4 Run `npm run --prefix client dev` (manually in terminal) and verify the app loads at `http://localhost:5173`, the `/login` route renders, and navigating to `/dashboard` without auth redirects to `/login`
