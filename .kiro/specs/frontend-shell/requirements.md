# Requirements Document — frontend-shell

## Introduction

The `frontend-shell` feature migrates and completes the React + Vite application scaffold under `client/` so that the Jarvis frontend is fully bootable, authenticated, and ready to host cognitive features. The scope covers:

- Removing deprecated dependencies (`amazon-cognito-identity-js`, `wouter`) and every file that imports them.
- Replacing the auth layer with AWS Amplify v6 (`aws-amplify/auth`, `@aws-amplify/ui-react`).
- Replacing the router with `react-router-dom` v6.
- Wiring all required providers at the application root.
- Delivering two functional routes: `/login` (public) and `/dashboard` (protected).
- Establishing a complete, lint-clean tooling configuration.

No cognitive features (thought ingestion, Cognitive Guardian, Focus Queue, Zen Mode) are included in this spec.

---

## Glossary

- **App**: The React application rendered from `client/src/main.tsx`.
- **Amplify_Config**: The call to `Amplify.configure()` executed once at application startup, consuming the four `VITE_` environment variables.
- **AuthProvider**: The React context provider defined in `client/src/_core/context/AuthContext.tsx` that wraps `Amplify.configure()` and exposes `{ user, session, signOut, isLoading }` to the component tree.
- **AuthContext**: The React context object created by `AuthProvider`, consumed via the `useAuth` hook.
- **useAuth**: The hook defined in `client/src/_core/hooks/useAuth.ts` that returns `{ user, session, signOut, isLoading }` from `AuthContext`.
- **Authenticator**: The `<Authenticator>` component from `@aws-amplify/ui-react` rendered by `LoginPage` to handle the sign-in flow.
- **ProtectedRoute**: The component in `client/src/components/ProtectedRoute.tsx` that calls `fetchAuthSession` to verify session validity and redirects unauthenticated users to `/login`.
- **DashboardPage**: The page component rendered at `/dashboard` — an empty state placeholder with no cognitive features.
- **DashboardLayout**: The layout wrapper in `client/src/components/layout/DashboardLayout.tsx` that renders `AppSidebar` and a main content area.
- **QueryClientProvider**: The TanStack Query root provider that makes `useQuery` and `useMutation` available to the component tree.
- **Toaster**: The `<Toaster>` component from `sonner` mounted once at the application root.
- **Router**: The `<BrowserRouter>` from `react-router-dom` v6 that wraps the route definitions.
- **Vite_Config**: The file `client/vite.config.ts` that configures the Vite build tool.
- **TS_Config**: The file `client/tsconfig.json` that configures the TypeScript compiler for the frontend.
- **ESLint_Config**: The ESLint flat-config file `client/eslint.config.js` and its associated devDependencies.
- **Env_Example**: The file `client/.env.example` that documents all required `VITE_` environment variables with placeholder values.
- **VITE_var**: Any environment variable prefixed with `VITE_`, which Vite exposes to client-side code at build time.

---

## Requirements

### Requirement 1: Deprecation Removal

**User Story:** As a developer, I want all references to `amazon-cognito-identity-js` and `wouter` removed from the codebase, so that the application depends only on the mandatory stack defined in `tech.md`.

#### Acceptance Criteria

1. THE App SHALL NOT import `amazon-cognito-identity-js` in any file after this migration.
2. THE App SHALL NOT import `wouter` in any file after this migration.
3. WHEN a file previously imported `amazon-cognito-identity-js`, THE App SHALL replace that import with the equivalent `aws-amplify/auth` API (`fetchAuthSession`, `getCurrentUser`, `signOut`).
4. WHEN a file previously imported `wouter`, THE App SHALL replace that import with the equivalent `react-router-dom` v6 API (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `useNavigate`, `Link`, `useLocation`).
5. THE App SHALL remove `amazon-cognito-identity-js` and `wouter` from `client/package.json` dependencies.

---

### Requirement 2: Application Entry Point

**User Story:** As a developer, I want a single entry point (`main.tsx`) that mounts the React application with all required providers in the correct order, so that every component in the tree has access to auth state, server-state management, and toast notifications.

#### Acceptance Criteria

1. THE App SHALL render from `client/src/main.tsx` by mounting a React root on the DOM element with `id="root"`.
2. WHEN the App mounts, THE App SHALL wrap the component tree in this exact order (outermost to innermost): `React.StrictMode`, `AuthProvider`, `QueryClientProvider`, then render `<Toaster />` and `<App />` as siblings inside `QueryClientProvider`.
3. THE App SHALL import and apply global CSS from `client/src/index.css` before rendering.
4. WHEN the App starts, THE App SHALL log a `console.warn` for each of the four `VITE_` variables (`VITE_AWS_REGION`, `VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID`, `VITE_WEBHOOK_URL`) that is absent from `import.meta.env`.
5. IF `main.tsx` does not exist, THEN THE App SHALL fail the TypeScript compilation step with a clear module-not-found error.

---

### Requirement 3: Auth Layer — AuthProvider and useAuth

**User Story:** As a developer, I want an `AuthProvider` that configures Amplify v6 and exposes session state via a `useAuth` hook, so that any component can access the current user and sign-out function without coupling to the Amplify SDK directly.

#### Acceptance Criteria

1. THE AuthProvider SHALL call `Amplify.configure()` exactly once on mount, using `VITE_AWS_REGION`, `VITE_AWS_COGNITO_USER_POOL_ID`, and `VITE_AWS_COGNITO_CLIENT_ID` from `import.meta.env`.
2. WHEN the AuthProvider mounts, THE AuthProvider SHALL call `getCurrentUser()` and `fetchAuthSession()` to restore session state from Amplify's local storage.
3. WHILE session restoration is in progress, THE AuthProvider SHALL set `isLoading` to `true` and render a full-screen loading indicator instead of the child tree.
4. THE useAuth hook SHALL expose `{ user, session, signOut, isLoading }` where `user` is the result of `getCurrentUser()`, `session` is the result of `fetchAuthSession()`, and `signOut` calls `signOut()` from `aws-amplify/auth`.
5. WHEN `signOut()` is called, THE AuthProvider SHALL set `user` to `null` and `session` to `null`.
6. IF `useAuth` is called outside of `AuthProvider`, THEN THE useAuth hook SHALL throw an error with a descriptive message.

---

### Requirement 4: Auth Layer — ProtectedRoute

**User Story:** As a developer, I want a `ProtectedRoute` component that guards routes using `fetchAuthSession`, so that unauthenticated users are always redirected to `/login` before accessing protected content.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any route wrapped by `ProtectedRoute`, THE ProtectedRoute SHALL redirect the user to `/login` using `react-router-dom`'s `<Navigate>` component.
2. WHEN an authenticated user navigates to a route wrapped by `ProtectedRoute`, THE ProtectedRoute SHALL render the child component without redirection.
3. THE ProtectedRoute SHALL determine authentication status by calling `fetchAuthSession` from `aws-amplify/auth` and checking for the presence of valid tokens.
4. WHILE `fetchAuthSession` is resolving, THE ProtectedRoute SHALL render a loading indicator rather than immediately redirecting.

---

### Requirement 5: Login Page

**User Story:** As a user, I want a `/login` page that renders the Amplify Authenticator component, so that I can sign in to my workspace using the standard Cognito flow.

#### Acceptance Criteria

1. THE LoginPage SHALL render `<Authenticator>` from `@aws-amplify/ui-react` as the primary sign-in interface.
2. WHEN a user successfully signs in via `<Authenticator>`, THE LoginPage SHALL navigate to `/dashboard` using `react-router-dom`'s `useNavigate`.
3. THE LoginPage SHALL NOT render `DashboardLayout` or `ProtectedRoute`.
4. WHEN an authenticated user navigates to `/login`, THE Router SHALL redirect the user to `/dashboard`.
5. THE LoginPage SHALL display the heading "Sign in to your workspace" as the page title.

---

### Requirement 6: Routing

**User Story:** As a user, I want the application to route me to the correct page based on my authentication state, so that protected content is never accessible without a valid session.

#### Acceptance Criteria

1. THE Router SHALL use `react-router-dom` v6 `<BrowserRouter>`, `<Routes>`, and `<Route>` components.
2. THE Router SHALL define exactly two primary routes: `/login` (public) and `/dashboard` (protected via `ProtectedRoute`).
3. WHEN a user navigates to any path not matched by the Router, THE Router SHALL redirect to `/dashboard` via `<Navigate>`.
4. WHEN an authenticated user navigates to `/dashboard`, THE Router SHALL render `DashboardPage` inside `DashboardLayout` wrapped by `ProtectedRoute`.
5. THE `/login` route SHALL render `LoginPage` without `DashboardLayout` or `ProtectedRoute`.

---

### Requirement 7: Dashboard Empty State

**User Story:** As a developer, I want a `/dashboard` page with an empty state placeholder, so that the protected route is functional and ready to receive cognitive features in future iterations.

#### Acceptance Criteria

1. THE DashboardPage SHALL render inside `DashboardLayout` (sidebar + main content area).
2. THE DashboardPage SHALL display a placeholder heading and a descriptive paragraph indicating that the workspace is ready.
3. THE DashboardPage SHALL NOT import or reference any cognitive feature components (Focus Queue, Zen Mode, Cognitive Guardian, thought ingestion).
4. WHILE the user is authenticated, THE DashboardPage SHALL remain accessible without re-authentication.

---

### Requirement 8: DashboardLayout Migration

**User Story:** As a developer, I want `DashboardLayout` and `AppSidebar` migrated to `react-router-dom` and the new Amplify-based auth context, so that navigation and sign-out work correctly with the new stack.

#### Acceptance Criteria

1. THE DashboardLayout SHALL NOT import `wouter` or any custom auth hook based on `amazon-cognito-identity-js`.
2. THE AppSidebar SHALL use `react-router-dom`'s `Link` and `useLocation` for navigation.
3. THE AppSidebar SHALL call `signOut` from the `useAuth` hook (Amplify-based) for the sign-out action.
4. WHEN the user clicks the sign-out button in `AppSidebar`, THE AppSidebar SHALL call `signOut()` and display a toast notification with the message "Your session has ended".

---

### Requirement 9: TanStack Query Provider

**User Story:** As a developer, I want `QueryClientProvider` wired at the application root, so that any component can use `useQuery` and `useMutation` without additional setup.

#### Acceptance Criteria

1. THE App SHALL instantiate a single `QueryClient` and pass it to `QueryClientProvider` at the root of the component tree.
2. WHEN a component calls `useQuery` outside of `QueryClientProvider`, THE App SHALL throw a React error indicating the missing provider context.
3. THE QueryClient SHALL be configured with a default `staleTime` of 0 and `retry` of 1.

---

### Requirement 10: api.ts Migration

**User Story:** As a developer, I want `client/src/lib/api.ts` migrated from `amazon-cognito-identity-js` to `aws-amplify/auth`, so that JWT retrieval uses the canonical Amplify v6 API.

#### Acceptance Criteria

1. THE api.ts module SHALL retrieve the JWT ID token by calling `fetchAuthSession()` from `aws-amplify/auth` and reading `session.tokens?.idToken?.toString()`.
2. THE api.ts module SHALL NOT import `amazon-cognito-identity-js` or `CognitoUserPool`.
3. WHEN `fetchAuthSession()` returns no valid tokens, THE api.ts module SHALL throw an error with the message "No active session".

---

### Requirement 11: Vite Configuration

**User Story:** As a developer, I want `vite.config.ts` to configure the `@tailwindcss/vite` plugin and the `@/` path alias, so that Tailwind CSS is processed at build time and imports resolve correctly.

#### Acceptance Criteria

1. THE Vite_Config SHALL register the `@tailwindcss/vite` plugin so that Tailwind CSS utility classes are generated during development and production builds.
2. THE Vite_Config SHALL define a path alias mapping `@` to `client/src/` so that imports using `@/` resolve to the correct source directory.
3. IF the `@tailwindcss/vite` plugin is absent from `vite.config.ts`, THEN the build SHALL produce unstyled output.

---

### Requirement 12: TypeScript Configuration

**User Story:** As a developer, I want `client/tsconfig.json` to declare path aliases consistent with `vite.config.ts` and enable strict mode, so that the TypeScript compiler resolves `@/` imports without errors.

#### Acceptance Criteria

1. THE TS_Config SHALL declare a `paths` entry mapping `@/*` to `["./src/*"]`.
2. THE TS_Config SHALL target `ES2020` or later and enable `strict` mode.
3. THE TS_Config SHALL set `moduleResolution` to `"bundler"`.
4. THE TS_Config SHALL include `"jsx": "react-jsx"` so that JSX transforms work without explicit React imports.
5. WHEN `tsc --noEmit` is run from `client/`, THE TS_Config SHALL produce zero type errors for the shell files.

---

### Requirement 13: ESLint Configuration

**User Story:** As a developer, I want ESLint configured with TypeScript-aware rules, so that code quality issues are caught before commit.

#### Acceptance Criteria

1. THE ESLint_Config SHALL use the ESLint v9 flat-config format (`eslint.config.js`) with `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`.
2. THE ESLint_Config SHALL extend `@typescript-eslint/recommended` rules.
3. THE ESLint_Config SHALL include `eslint-plugin-react-hooks` to enforce the Rules of Hooks.
4. WHEN `eslint .` is run from `client/`, THE ESLint_Config SHALL report zero errors on the shell files.
5. THE ESLint_Config SHALL ignore `node_modules/`, `dist/`, and generated files.

---

### Requirement 14: Package Manifest and Scripts

**User Story:** As a developer, I want a complete `client/package.json` with all runtime and dev dependencies declared and standardized scripts, so that the frontend can be installed, built, linted, and tested in isolation.

#### Acceptance Criteria

1. THE App SHALL expose a `lint` script in `client/package.json` that runs `eslint . --max-warnings 0`.
2. THE App SHALL expose a `typecheck` script in `client/package.json` that runs `tsc --noEmit`.
3. THE App SHALL expose a `test` script in `client/package.json` that runs `vitest run`.
4. THE App SHALL expose a `dev` script in `client/package.json` that runs `vite`.
5. THE App SHALL expose a `build` script in `client/package.json` that runs `vite build`.
6. THE App SHALL declare all runtime dependencies listed in the mandatory stack, including `react-router-dom ^6`, `@aws-amplify/ui-react ^6`, `aws-amplify ^6`, `@tanstack/react-query ^5`, and `sonner ^2`.
7. THE App SHALL declare all dev dependencies listed in the mandatory stack, including `vitest ^2`, `@testing-library/react ^16`, `@testing-library/jest-dom ^6`, and `fast-check ^3`.
8. WHEN any of the above scripts are run from the workspace root via `npm run --prefix client <script>`, THE App SHALL execute without path resolution errors.

---

### Requirement 15: Environment Variable Contract

**User Story:** As a developer, I want `client/.env.example` to document every required `VITE_` variable with placeholder values, so that any contributor can bootstrap the application without access to production secrets.

#### Acceptance Criteria

1. THE Env_Example SHALL declare `VITE_AWS_REGION` with the placeholder value `us-east-1`.
2. THE Env_Example SHALL declare `VITE_AWS_COGNITO_USER_POOL_ID` with the placeholder value `us-east-1_XXXXXXXXX`.
3. THE Env_Example SHALL declare `VITE_AWS_COGNITO_CLIENT_ID` with the placeholder value `your-cognito-client-id`.
4. THE Env_Example SHALL declare `VITE_WEBHOOK_URL` with the placeholder value `http://your-ec2-ip:5678/webhook/tasks`.
5. THE Env_Example SHALL NOT contain real credentials, real pool IDs, or real endpoint URLs.
6. WHEN a required `VITE_` variable is absent from the runtime environment, THE App SHALL surface a `console.warn` in the browser console identifying the missing variable by name.

---

### Requirement 16: shadcn/ui Initialization

**User Story:** As a developer, I want shadcn/ui initialized with a `components.json` config and the `button` component installed, so that the design system baseline is validated and ready for use.

#### Acceptance Criteria

1. THE App SHALL include a `components.json` file at the `client/` root generated by `npx shadcn@latest init`.
2. THE App SHALL include the `button` component at `client/src/components/ui/button.tsx` installed via `npx shadcn@latest add button`.
3. THE components.json SHALL reference the default theme and the `@/` path alias.

---

### Requirement 17: Correctness Properties

**User Story:** As a developer, I want automated correctness properties for the shell's critical invariants, so that regressions in routing and auth state are caught by the test suite.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access any URL path, THE ProtectedRoute SHALL always redirect to `/login` — for all possible route paths (property-based test).
2. WHEN `signOut()` is called from any prior authenticated state, THE AuthProvider SHALL always result in `fetchAuthSession` returning no valid tokens and `getCurrentUser` throwing — regardless of prior session state (property-based test).
3. THE App SHALL always render `QueryClientProvider` as an ancestor of any component that calls `useQuery` or `useMutation` (example test).
4. THE Env_Example SHALL always contain entries for all four required `VITE_` keys: `VITE_AWS_REGION`, `VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID`, and `VITE_WEBHOOK_URL` (example test).
5. WHEN an authenticated user navigates to `/login`, THE Router SHALL always redirect to `/dashboard` (example test).
