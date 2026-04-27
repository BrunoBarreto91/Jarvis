# Requirements Document — frontend-shell

## Introduction

The `frontend-shell` feature completes the React + Vite application scaffold under `client/` so that the Jarvis frontend is fully bootable, authenticated, and ready to host cognitive features. The scope covers the application entry point, provider wiring, routing, tooling configuration, and the `/dashboard` protected route. No cognitive features (thought ingestion, Cognitive Guardian, Focus Queue, Zen Mode) are included.

The existing partial scaffold already contains `AuthContext`, `useAuth`, `ProtectedRoute`, `DashboardLayout`, `AppSidebar`, `LoginPage`, and several page stubs. This spec documents what must be completed to connect those pieces into a working, lint-clean, type-safe application.

> **Auth implementation note:** The steering file (`tech.md`) specifies "Amplify UI for AWS Cognito" as the auth approach. The existing codebase uses `amazon-cognito-identity-js` directly via a custom `useAuth` hook and `AuthProvider`. This spec documents the **actual implementation** (custom Cognito hooks) and records the deviation. An ADR (`docs/adr/001-custom-cognito-auth.md`) must be created as part of this feature to formally acknowledge the divergence.

---

## Glossary

- **App**: The React application rendered from `client/src/main.tsx`.
- **AuthProvider**: The React context provider defined in `client/src/_core/context/AuthContext.tsx` that exposes Cognito session state.
- **QueryClientProvider**: The TanStack Query root provider that makes `useQuery` / `useMutation` available to the component tree.
- **Router**: The wouter `<Switch>` component that maps URL paths to page components.
- **ProtectedRoute**: The component in `client/src/components/ProtectedRoute.tsx` that redirects unauthenticated users to `/login`.
- **DashboardPage**: The new page component rendered at `/dashboard` — an empty state placeholder with no cognitive features.
- **DashboardLayout**: The layout wrapper in `client/src/components/layout/DashboardLayout.tsx` that renders `AppSidebar` and a main content area.
- **Vite_Config**: The file `client/vite.config.ts` that configures the Vite build tool.
- **TS_Config**: The file `client/tsconfig.json` that configures the TypeScript compiler for the frontend.
- **ESLint_Config**: The ESLint flat-config file `client/eslint.config.js` and its associated devDependencies.
- **Env_Example**: The file `client/.env.example` that documents all required `VITE_` environment variables with placeholder values.
- **VITE_var**: Any environment variable prefixed with `VITE_`, which Vite exposes to client-side code at build time.

---

## Requirements

### Requirement 1: Application Entry Point

**User Story:** As a developer, I want a single entry point (`main.tsx`) that mounts the React application with all required providers, so that every component in the tree has access to auth state and server-state management.

#### Acceptance Criteria

1. THE App SHALL render from `client/src/main.tsx` by mounting a React root on the DOM element with `id="root"`.
2. WHEN the App mounts, THE App SHALL wrap the component tree in `AuthProvider`, `QueryClientProvider`, and `Router` in that order (outermost to innermost).
3. THE App SHALL import and apply global CSS from `client/src/index.css` before rendering.
4. IF `main.tsx` does not exist, THEN THE App SHALL fail the TypeScript compilation step with a clear module-not-found error.

---

### Requirement 2: Routing

**User Story:** As a user, I want the application to route me to the correct page based on my authentication state, so that protected content is never accessible without a valid session.

#### Acceptance Criteria

1. THE Router SHALL define exactly two primary routes: `/login` (public) and `/dashboard` (protected).
2. WHEN an unauthenticated user navigates to `/dashboard`, THE ProtectedRoute SHALL redirect the user to `/login`.
3. WHEN an authenticated user navigates to `/login`, THE Router SHALL redirect the user to `/dashboard`.
4. WHEN an authenticated user navigates to `/dashboard`, THE Router SHALL render `DashboardPage` inside `DashboardLayout`.
5. WHEN a user navigates to any path not matched by the Router, THE Router SHALL redirect to `/dashboard`.
6. THE `/login` route SHALL render `LoginPage` without `DashboardLayout` or `ProtectedRoute`.

---

### Requirement 3: Dashboard Empty State

**User Story:** As a developer, I want a `/dashboard` page with an empty state placeholder, so that the protected route is functional and ready to receive cognitive features in future iterations.

#### Acceptance Criteria

1. THE DashboardPage SHALL render inside `DashboardLayout` (sidebar + main content area).
2. THE DashboardPage SHALL display a placeholder heading and a descriptive paragraph indicating that cognitive features are not yet available.
3. THE DashboardPage SHALL NOT import or reference any cognitive feature components (Focus Queue, Zen Mode, Cognitive Guardian, thought ingestion).
4. WHILE the user is authenticated, THE DashboardPage SHALL remain accessible without re-authentication.

---

### Requirement 4: TanStack Query Provider

**User Story:** As a developer, I want `QueryClientProvider` wired at the application root, so that any component can use `useQuery` and `useMutation` without additional setup.

#### Acceptance Criteria

1. THE App SHALL instantiate a single `QueryClient` and pass it to `QueryClientProvider` at the root of the component tree.
2. WHEN a component calls `useQuery` outside of `QueryClientProvider`, THE App SHALL throw a React error indicating the missing provider context.
3. THE QueryClient SHALL be configured with a default `staleTime` of 0 and `retry` of 1 to match the n8n webhook backend's stateless nature.

---

### Requirement 5: Vite Configuration

**User Story:** As a developer, I want `vite.config.ts` to configure the `@tailwindcss/vite` plugin and the `@/` path alias, so that Tailwind CSS is processed at build time and imports resolve correctly.

#### Acceptance Criteria

1. THE Vite_Config SHALL register the `@tailwindcss/vite` plugin so that Tailwind CSS utility classes are generated during development and production builds.
2. THE Vite_Config SHALL define a path alias mapping `@` to `client/src/` so that imports using `@/` resolve to the correct source directory.
3. THE Vite_Config SHALL set the project root to `client/` so that `index.html` is resolved from the correct location.
4. IF the `@tailwindcss/vite` plugin is absent from `vite.config.ts`, THEN the build SHALL produce unstyled output.

---

### Requirement 6: TypeScript Configuration

**User Story:** As a developer, I want `client/tsconfig.json` to declare path aliases consistent with `vite.config.ts`, so that the TypeScript compiler resolves `@/` imports without errors.

#### Acceptance Criteria

1. THE TS_Config SHALL declare a `paths` entry mapping `@/*` to `["./src/*"]`.
2. THE TS_Config SHALL target `ES2020` or later and enable `strict` mode.
3. THE TS_Config SHALL include `"jsx": "react-jsx"` so that JSX transforms work without explicit React imports.
4. WHEN `tsc --noEmit` is run from `client/`, THE TS_Config SHALL produce zero type errors for the shell files.

---

### Requirement 7: ESLint Configuration

**User Story:** As a developer, I want ESLint configured with TypeScript-aware rules, so that code quality issues are caught before commit.

#### Acceptance Criteria

1. THE ESLint_Config SHALL use the ESLint flat-config format (`eslint.config.js`) with `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`.
2. THE ESLint_Config SHALL extend `plugin:@typescript-eslint/recommended` rules.
3. THE ESLint_Config SHALL include `eslint-plugin-react-hooks` to enforce the Rules of Hooks.
4. WHEN `eslint .` is run from `client/`, THE ESLint_Config SHALL report zero errors on the shell files.
5. THE ESLint_Config SHALL ignore `node_modules/`, `dist/`, and generated files.

---

### Requirement 8: Package Scripts

**User Story:** As a developer, I want standardized scripts in `client/package.json`, so that lint, typecheck, and test can be run with a single command.

#### Acceptance Criteria

1. THE App SHALL expose a `lint` script in `client/package.json` that runs `eslint . --max-warnings 0`.
2. THE App SHALL expose a `typecheck` script in `client/package.json` that runs `tsc --noEmit`.
3. THE App SHALL expose a `test` script in `client/package.json` that runs `vitest run`.
4. THE App SHALL expose a `dev` script in `client/package.json` that runs `vite`.
5. THE App SHALL expose a `build` script in `client/package.json` that runs `vite build`.
6. WHEN any of the above scripts are run from the workspace root via `npm run --prefix client <script>`, THE App SHALL execute without path resolution errors.

---

### Requirement 9: Environment Variable Contract

**User Story:** As a developer, I want `client/.env.example` to document every required `VITE_` variable with placeholder values, so that any contributor can bootstrap the application without access to production secrets.

#### Acceptance Criteria

1. THE Env_Example SHALL declare `VITE_AWS_COGNITO_USER_POOL_ID` with a placeholder value.
2. THE Env_Example SHALL declare `VITE_AWS_COGNITO_CLIENT_ID` with a placeholder value.
3. THE Env_Example SHALL declare `VITE_WEBHOOK_URL` with a placeholder value pointing to the n8n webhook endpoint.
4. THE Env_Example SHALL NOT contain real credentials, real pool IDs, or real endpoint URLs.
5. WHEN a required `VITE_` variable is absent from the runtime environment, THE App SHALL surface a runtime warning in the browser console identifying the missing variable by name.

---

### Requirement 10: Auth Deviation ADR

**User Story:** As a technical stakeholder, I want a formal Architecture Decision Record documenting the divergence from the steering-specified auth approach, so that the decision is traceable and reviewable.

#### Acceptance Criteria

1. THE App SHALL include an ADR at `docs/adr/001-custom-cognito-auth.md` documenting the decision to use `amazon-cognito-identity-js` directly instead of `@aws-amplify/ui-react`.
2. THE ADR SHALL state the context (steering specifies Amplify UI; existing code uses custom hooks), the decision, and the consequences.
3. THE ADR SHALL follow the standard ADR format: Title, Status, Context, Decision, Consequences.

---

### Requirement 11: Correctness Properties

**User Story:** As a developer, I want automated correctness properties for the shell's critical invariants, so that regressions in routing and auth state are caught by the test suite.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access any protected route, THE ProtectedRoute SHALL always redirect to `/login` — for all possible route paths.
2. WHEN `logout()` is called, THE AuthProvider SHALL always set `isAuthenticated` to `false` and `user` to `null`, regardless of prior session state.
3. THE App SHALL always render `QueryClientProvider` as an ancestor of any component that calls `useQuery` or `useMutation`.
4. THE Env_Example SHALL always contain entries for `VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID`, and `VITE_WEBHOOK_URL`.
