# Tasks — frontend-shell

## Overview

Tasks are ordered for sequential execution. Each task builds on the previous. Complete tasks in order to avoid broken intermediate states.

---

- [x] 1. Remove deprecated dependencies and code
  - [x] 1.1 Remove `amazon-cognito-identity-js` and `wouter` from the root `package.json` dependencies
  - [x] 1.2 Delete `client/src/_core/context/AuthContext.tsx` (old Cognito-based version)
  - [x] 1.3 Delete `client/src/_core/hooks/useAuth.ts` (old Cognito-based version)
  - [x] 1.4 Delete `client/src/components/ProtectedRoute.tsx` (old wouter-based version)
  - [x] 1.5 Delete `client/src/pages/LoginPage.tsx` (old custom form version)
  - [x] 1.6 Verify no remaining file in `client/src/` imports `amazon-cognito-identity-js` or `wouter` after the above deletions (search for both strings)
  - [x] 1.7 Run `rm -rf node_modules package-lock.json && npm install` from the repository root to rebuild the root `node_modules` without the removed frontend dependencies
  - [x] 1.8 Inspect scripts in the root `package.json`; any script that invokes `vite`, `tsc`, `eslint`, or `vitest` directly must either be removed (if redundant with the new `client/` scripts) or rewritten to use `npm --prefix client run <script>`; document the changes made in the task output

- [x] 2. Create configuration files
  - [x] 2.1 Create `client/package.json` with `name: "jarvis-client"`, `private: true`, `type: "module"`, and scripts: `dev` (vite), `build` (vite build), `typecheck` (tsc --noEmit), `lint` (eslint . --max-warnings 0), `test` (vitest run)
  - [x] 2.2 Add all runtime dependencies to `client/package.json`: `react ^19`, `react-dom ^19`, `react-router-dom ^6`, `@aws-amplify/ui-react ^6`, `aws-amplify ^6`, `@tanstack/react-query ^5`, `sonner ^2`, `tailwindcss ^4`, `class-variance-authority ^0.7`, `clsx ^2`, `tailwind-merge ^3`, `lucide-react ^0.453`
  - [x] 2.3 Add all dev dependencies to `client/package.json`: `vite ^7`, `@vitejs/plugin-react ^5`, `@tailwindcss/vite ^4`, `typescript ^5`, `vitest ^2`, `@testing-library/react ^16`, `@testing-library/jest-dom ^6`, `fast-check ^3`, `eslint ^9`, `@typescript-eslint/eslint-plugin ^8`, `@typescript-eslint/parser ^8`, `eslint-plugin-react-hooks ^5`, `globals ^15`, `@types/react ^19`, `@types/react-dom ^19`, `@types/node ^24`
  - [x] 2.4 Create `client/tsconfig.json` with `target: "ES2020"`, `lib: ["ES2020", "DOM", "DOM.Iterable"]`, `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `strict: true`, `noEmit: true`, `skipLibCheck: true`, `baseUrl: "."`, `paths: { "@/*": ["./src/*"] }`, `include: ["src"]`
  - [x] 2.5 Create `client/vite.config.ts` importing `defineConfig` from `vite`, `react` from `@vitejs/plugin-react`, `tailwindcss` from `@tailwindcss/vite`, and `path` from `node:path`; register `react()` and `tailwindcss()` in plugins; define `resolve.alias` mapping `"@"` to `path.resolve(__dirname, "./src")`
  - [x] 2.6 Create `client/eslint.config.js` using ESLint v9 flat-config format with `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react-hooks`; extend `@typescript-eslint/recommended`; enable `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`; set `ignores` to exclude `node_modules/`, `dist/`, and `*.config.*`
  - [x] 2.7 Update `client/.env.example` to contain exactly these four variables with placeholder values: `VITE_AWS_REGION=us-east-1`, `VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX`, `VITE_AWS_COGNITO_CLIENT_ID=your-cognito-client-id`, `VITE_WEBHOOK_URL=http://your-ec2-ip:5678/webhook/tasks`
  - [x] 2.8 Run `npm install` from `client/` to install all declared dependencies

- [x] 3. Initialize shadcn/ui
  - [x] 3.1 Run `npx shadcn@latest init` from `client/` to generate `components.json` with the default theme and `@/` path alias
  - [x] 3.2 Run `npx shadcn@latest add button` from `client/` to install `client/src/components/ui/button.tsx`
  - [x] 3.3 Verify `components.json` exists at `client/` root and references `@/components` and `@/lib/utils`

- [x] 4. Create the Amplify-based auth layer
  - [x] 4.1 Create `client/src/_core/context/AuthContext.tsx`: define `AuthContext` with shape `{ user, session, signOut, isLoading }`; call `Amplify.configure()` with `VITE_AWS_REGION`, `VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID` from `import.meta.env`; restore session on mount via `getCurrentUser()` and `fetchAuthSession()`; set `isLoading: true` during restoration and render a full-screen spinner; expose `signOut` that calls `signOut()` from `aws-amplify/auth` then clears `user` and `session` state
  - [x] 4.2 Create `client/src/_core/hooks/useAuth.ts`: export `useAuth` that reads from `AuthContext` and throws a descriptive error if called outside `AuthProvider`
  - [x] 4.3 Create `client/src/components/ProtectedRoute.tsx`: call `fetchAuthSession()` from `aws-amplify/auth`; render a loading spinner while resolving; render `<Navigate to="/login" replace />` when no valid tokens are present; render `children` when authenticated

- [x] 5. Create LoginPage
  - [x] 5.1 Create `client/src/pages/LoginPage.tsx` rendering `<Authenticator>` from `@aws-amplify/ui-react` as the primary sign-in interface
  - [x] 5.2 Add a page heading "Sign in to your workspace" above the `<Authenticator>` component
  - [x] 5.3 Use the `useAuthenticator` hook from `@aws-amplify/ui-react` to read `authStatus`; inside a `useEffect`, when `authStatus === 'authenticated'`, call `navigate('/dashboard')` from `react-router-dom`'s `useNavigate` — do NOT use the `onSignIn` callback
  - [x] 5.4 Apply Tailwind CSS classes to center the form vertically and horizontally on the page

- [x] 6. Create DashboardPage
  - [x] 6.1 Create `client/src/pages/DashboardPage.tsx` as a default-exported React component
  - [x] 6.2 Render a heading (e.g., "Your workspace is ready") and a paragraph indicating that cognitive features will appear here
  - [x] 6.3 Do NOT import any cognitive feature components (Focus Queue, Zen Mode, Cognitive Guardian, thought ingestion)
  - [x] 6.4 Apply Tailwind CSS classes consistent with the existing slate color palette

- [x] 7. Verify and migrate DashboardLayout and AppSidebar
  - [x] 7.1 Confirm `client/src/components/layout/DashboardLayout.tsx` does not import `wouter`, `amazon-cognito-identity-js`, `useAuthContext`, or `useAuth` — it currently does not, so no change is required
  - [x] 7.2 Migrate `client/src/components/layout/AppSidebar.tsx`: replace `import { Link, useLocation } from "wouter"` with `import { Link, useLocation } from "react-router-dom"`
  - [x] 7.3 In `AppSidebar.tsx`: replace `import { useAuthContext } from "@/_core/context/AuthContext"` with `import { useAuth } from "@/_core/hooks/useAuth"`
  - [x] 7.4 In `AppSidebar.tsx`: replace `const { logout, user } = useAuthContext()` with `const { signOut, user } = useAuth()`
  - [x] 7.5 In `AppSidebar.tsx`: replace `logout()` with `signOut()` in the `handleLogout` function
  - [x] 7.6 In `AppSidebar.tsx`: update the toast message from `"Sessão encerrada."` to `"Your session has ended"`
  - [x] 7.7 In `AppSidebar.tsx`: replace `<Link href={item.url}>` with `<Link to={item.url}>`
  - [x] 7.8 In `AppSidebar.tsx`: replace `const [location] = useLocation()` with `const location = useLocation()` and update the active check from `location === item.url` to `location.pathname === item.url`

- [x] 8. Wire App.tsx
  - [x] 8.1 Create `client/src/App.tsx` importing `BrowserRouter`, `Routes`, `Route`, `Navigate` from `react-router-dom`
  - [x] 8.2 Import `LoginPage`, `DashboardPage`, `ProtectedRoute`, `DashboardLayout`
  - [x] 8.3 Define routes inside `<BrowserRouter><Routes>`: `<Route path="/login" element={<LoginPage />} />`, `<Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />`, `<Route path="*" element={<Navigate to="/dashboard" replace />} />`
  - [x] 8.4 Export `App` as the default export

- [x] 9. Wire main.tsx
  - [x] 9.1 Create `client/src/main.tsx` importing `React`, `ReactDOM`, `AuthProvider`, `QueryClient`, `QueryClientProvider`, `Toaster`, and `App`
  - [x] 9.2 Instantiate `QueryClient` with `defaultOptions: { queries: { staleTime: 0, retry: 1 } }`
  - [x] 9.3 Add a startup validation block that logs `console.warn` for each missing variable among `VITE_AWS_REGION`, `VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID`, `VITE_WEBHOOK_URL`
  - [x] 9.4 Mount `<React.StrictMode><AuthProvider><QueryClientProvider client={queryClient}><Toaster /><App /></QueryClientProvider></AuthProvider></React.StrictMode>` on `document.getElementById("root")`
  - [x] 9.5 Import `./index.css` before the React root mount

- [x] 10. Migrate api.ts
  - [x] 10.1 Remove the `CognitoUserPool` import and instantiation from `client/src/lib/api.ts`
  - [x] 10.2 Add `import { fetchAuthSession } from "aws-amplify/auth"` to `client/src/lib/api.ts`
  - [x] 10.3 Replace the `getIdToken` function body: call `fetchAuthSession()`, read `session.tokens?.idToken?.toString()`, throw `new Error("No active session")` if the token is absent

- [x] 11. Write correctness tests in `client/src/__tests__/`
  - [x] 11.1 Create `client/src/__tests__/` directory
  - [x] 11.2 Create `client/src/__tests__/setup.ts` importing `@testing-library/jest-dom` for DOM matchers; reference it in `vitest.config.ts` (or in `client/package.json` vitest config) via `setupFiles`
  - [x] 11.3 Write property test `route-protection.test.tsx`: use `fast-check` `fc.webPath()` to generate arbitrary paths; for each path, mock `fetchAuthSession` to return no tokens; render `ProtectedRoute` inside a `MemoryRouter`; assert the rendered output navigates to `/login`
  - [x] 11.4 Write property test `signout-invariant.test.tsx`: use `fast-check` `fc.record({ username: fc.string({ minLength: 1 }), userId: fc.uuid() })` to generate prior user states; render `AuthProvider` with a mocked Amplify; call `signOut()`; assert `user` is `null` and `session` is `null`
  - [x] 11.5 Write example test `provider-tree.test.tsx`: render the full `App` tree and assert a component calling `useQuery` does not throw; assert `QueryClientProvider` is present in the tree
  - [x] 11.6 Write example test `env-contract.test.ts`: read `client/.env.example` as a string; assert it contains `VITE_AWS_REGION`, `VITE_AWS_COGNITO_USER_POOL_ID`, `VITE_AWS_COGNITO_CLIENT_ID`, and `VITE_WEBHOOK_URL`
  - [x] 11.7 Write example test `authenticated-redirect.test.tsx`: mock `fetchAuthSession` to return valid tokens; render `App` with `MemoryRouter` at initial path `/login`; assert the rendered location is `/dashboard`

- [-] 12. Verification
  - [x] 12.1 Run `npm run --prefix client typecheck` — expect zero TypeScript errors
  - [x] 12.2 Run `npm run --prefix client lint` — expect zero ESLint errors and zero warnings
  - [x] 12.3 Run `npm run --prefix client test` — expect all tests pass
  - [ ] 12.4 Run `npm run --prefix client dev` manually in a terminal and verify the app loads at `http://localhost:5173`, the `/login` route renders the Amplify Authenticator, and navigating to `/dashboard` without auth redirects to `/login`
