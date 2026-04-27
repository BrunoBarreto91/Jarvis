# Design Document — frontend-shell

## Overview

This document describes the technical design for completing the Jarvis frontend shell. The goal is a bootable, authenticated, lint-clean React + Vite application under `client/` that exposes two routes (`/login` and `/dashboard`) and wires all required providers at the root. No cognitive features are included.

The design builds on the existing partial scaffold and specifies only the files that must be created or modified to satisfy the requirements.

---

## Architecture

### Provider Tree

The application renders a single provider hierarchy. Every provider is instantiated once at the root and never re-instantiated on navigation.

```
<React.StrictMode>
  <AuthProvider>                  ← Cognito session state (AuthContext.tsx)
    <QueryClientProvider>         ← TanStack Query root
      <Toaster />                 ← sonner toast notifications (global)
      <Router>                    ← wouter Switch
        /login   → <LoginPage />
        /dashboard → <ProtectedRoute> → <DashboardLayout> → <DashboardPage />
        *        → <Redirect to="/dashboard" />
      </Router>
    </QueryClientProvider>
  </AuthProvider>
</React.StrictMode>
```

`AuthProvider` is outermost because `ProtectedRoute` and `AppSidebar` both consume `useAuthContext()`. `QueryClientProvider` wraps the Router so that page components can call `useQuery` without additional setup.

### Routing

wouter is the router. Route matching is handled by a `<Switch>` with explicit `<Route>` entries. The redirect from authenticated users on `/login` is handled inside `LoginPage` (post-login navigation) rather than a wrapper component, keeping the route table simple.

```
/login        → LoginPage          (public, no layout)
/dashboard    → ProtectedRoute
                  └─ DashboardLayout
                       └─ DashboardPage
*             → Redirect /dashboard
```

`ProtectedRoute` reads `isAuthenticated` from `AuthContext`. When `false`, it issues a wouter `<Redirect to="/login?redirect=<encoded-path>" />`. The `redirect` query parameter is preserved for future post-login redirect support.

### Auth Architecture

The application uses `amazon-cognito-identity-js` directly via the custom `useAuth` hook (`client/src/_core/hooks/useAuth.ts`). This deviates from the steering file (`tech.md`) which specifies `@aws-amplify/ui-react`. The deviation is documented in `docs/adr/001-custom-cognito-auth.md`.

The custom approach provides:
- Full control over the Cognito flow (sign-up, confirm, forgot password, change password, delete user)
- No dependency on Amplify's opinionated UI components
- JWT token retrieval via `getIdToken()` for use in `api.ts`

`AuthProvider` calls `checkAuth()` on mount to restore session from Cognito's local storage. During initialization, a full-screen spinner is rendered to prevent flash-of-login.

---

## Component Tree

```
main.tsx
└── React.StrictMode
    └── AuthProvider (AuthContext.tsx)
        └── QueryClientProvider (TanStack Query)
            ├── Toaster (sonner)
            └── Router (wouter Switch)
                ├── Route path="/login"
                │   └── LoginPage
                ├── Route path="/dashboard"
                │   └── ProtectedRoute
                │       └── DashboardLayout
                │           └── DashboardPage  ← NEW
                └── Route (catch-all)
                    └── Redirect to="/dashboard"
```

### New Files

| File | Purpose |
|------|---------|
| `client/src/main.tsx` | Application entry point — mounts React root, wires providers |
| `client/src/App.tsx` | Router and route definitions |
| `client/src/pages/DashboardPage.tsx` | Empty state placeholder for `/dashboard` |
| `client/vite.config.ts` | Vite config with `@tailwindcss/vite` plugin and `@/` alias |
| `client/tsconfig.json` | TypeScript config with path aliases and strict mode |
| `client/package.json` | Frontend-specific package manifest with lint/typecheck/test scripts |
| `client/eslint.config.js` | ESLint flat-config with TypeScript and React Hooks rules |
| `docs/adr/001-custom-cognito-auth.md` | ADR documenting auth deviation |

### Modified Files

| File | Change |
|------|--------|
| `client/.env.example` | Verify all three `VITE_` vars are present with placeholder values |

### Existing Files (no change required)

| File | Role in shell |
|------|--------------|
| `client/src/_core/context/AuthContext.tsx` | AuthProvider and `useAuthContext` hook |
| `client/src/_core/hooks/useAuth.ts` | Cognito session management |
| `client/src/components/ProtectedRoute.tsx` | Route guard |
| `client/src/components/layout/DashboardLayout.tsx` | Sidebar + main content layout |
| `client/src/components/layout/AppSidebar.tsx` | Navigation sidebar |
| `client/src/pages/LoginPage.tsx` | Login form |
| `client/src/lib/api.ts` | JWT-authenticated fetch client |
| `client/src/components/ErrorBoundary.tsx` | Error isolation |
| `client/src/components/ui/*` | shadcn/ui primitives |
| `client/index.html` | HTML entry point (references `src/main.tsx`) |

---

## File Structure

```
client/
├── index.html                          # HTML entry (references /src/main.tsx)
├── vite.config.ts                      # NEW — Vite config
├── tsconfig.json                       # NEW — TS config
├── package.json                        # NEW — frontend scripts + deps
├── eslint.config.js                    # NEW — ESLint flat-config
├── .env.example                        # VERIFY — all VITE_ vars present
└── src/
    ├── main.tsx                        # NEW — React root + providers
    ├── App.tsx                         # NEW — Router + routes
    ├── index.css                       # Tailwind CSS directives
    ├── _core/
    │   ├── context/
    │   │   └── AuthContext.tsx         # EXISTING
    │   └── hooks/
    │       └── useAuth.ts              # EXISTING
    ├── components/
    │   ├── ProtectedRoute.tsx          # EXISTING
    │   ├── ErrorBoundary.tsx           # EXISTING
    │   ├── layout/
    │   │   ├── DashboardLayout.tsx     # EXISTING
    │   │   └── AppSidebar.tsx          # EXISTING
    │   └── ui/                         # EXISTING — shadcn/ui primitives
    ├── lib/
    │   └── api.ts                      # EXISTING
    ├── hooks/
    │   └── use-mobile.tsx              # EXISTING
    └── pages/
        ├── LoginPage.tsx               # EXISTING
        ├── DashboardPage.tsx           # NEW
        ├── TasksPage.tsx               # EXISTING (not routed in shell)
        └── ...                         # EXISTING stubs
```

---

## Configuration Details

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  root: ".",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

The `root` is set to `client/` (the directory containing `vite.config.ts`). The `@/` alias maps to `./src` relative to the config file.

### tsconfig.json (client/)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### QueryClient Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 1,
    },
  },
});
```

`staleTime: 0` ensures data is always considered stale and re-fetched on mount, appropriate for the n8n webhook backend which has no cache headers. `retry: 1` avoids hammering a potentially unavailable webhook endpoint.

### ESLint Configuration (eslint.config.js)

Uses the ESLint v9 flat-config format. Extends `@typescript-eslint/recommended` and `eslint-plugin-react-hooks`. Ignores `node_modules/`, `dist/`, and `*.config.*` files.

Required devDependencies to add to `client/package.json`:
- `eslint` ^9.x
- `@typescript-eslint/eslint-plugin` ^8.x
- `@typescript-eslint/parser` ^8.x
- `eslint-plugin-react-hooks` ^5.x
- `globals` ^15.x

---

## Environment Variable Table

| Variable | Required | Description | Placeholder |
|----------|----------|-------------|-------------|
| `VITE_AWS_COGNITO_USER_POOL_ID` | Yes | AWS Cognito User Pool ID | `us-east-1_XXXXXXXXX` |
| `VITE_AWS_COGNITO_CLIENT_ID` | Yes | Cognito App Client ID | `your-cognito-client-id` |
| `VITE_WEBHOOK_URL` | Yes | n8n webhook base URL for task operations | `http://your-ec2-ip:5678/webhook/tasks` |

All three variables are consumed at module load time in `useAuth.ts` and `api.ts`. If any is absent, the application will fail silently (Cognito SDK will receive `undefined`). A startup validation check in `main.tsx` logs a console warning for each missing variable.

---

## Dependency Inventory

### Runtime Dependencies (already in root `package.json`)

| Package | Version | Role |
|---------|---------|------|
| `react` | ^19.1.1 | UI framework |
| `react-dom` | ^19.1.1 | DOM renderer |
| `wouter` | ^3.3.5 | Client-side router |
| `amazon-cognito-identity-js` | (in root) | Cognito session management |
| `@tanstack/react-query` | ^5.90.2 | Server state management |
| `sonner` | ^2.0.7 | Toast notifications |
| `lucide-react` | ^0.453.0 | Icon set |
| `tailwind-merge` | ^3.3.1 | Tailwind class merging utility |
| `clsx` | ^2.1.1 | Conditional class names |

### Dev Dependencies (already in root `package.json`)

| Package | Version | Role |
|---------|---------|------|
| `vite` | ^7.1.7 | Build tool |
| `@vitejs/plugin-react` | ^5.0.4 | React fast refresh |
| `@tailwindcss/vite` | ^4.1.18 | Tailwind CSS Vite plugin |
| `tailwindcss` | ^4.1.14 | CSS framework |
| `typescript` | 5.9.3 | Type checker |
| `vitest` | ^2.1.4 | Test runner |
| `prettier` | ^3.6.2 | Code formatter |
| `@types/react` | ^19.1.16 | React type definitions |
| `@types/react-dom` | ^19.1.9 | ReactDOM type definitions |
| `@types/node` | ^24.7.0 | Node.js type definitions |

### Dev Dependencies to Add (ESLint)

| Package | Version | Role |
|---------|---------|------|
| `eslint` | ^9.x | Linter |
| `@typescript-eslint/eslint-plugin` | ^8.x | TypeScript lint rules |
| `@typescript-eslint/parser` | ^8.x | TypeScript parser for ESLint |
| `eslint-plugin-react-hooks` | ^5.x | React Hooks lint rules |
| `globals` | ^15.x | Global variable definitions for ESLint |

> Note: The root `package.json` does not have a separate `client/package.json`. The `client/package.json` must be created to scope frontend scripts and devDependencies. The root `package.json` already contains all runtime and most dev dependencies; the `client/package.json` will reference them via workspace or duplicate the relevant entries.

---

## Correctness Properties

Based on the prework analysis, the following properties are testable and should be covered by the test suite in `client/src/__tests__/`.

### Property 1: Route Protection Invariant (Property-Based)

**Criterion:** Unauthenticated access to any protected route always redirects to `/login`.

**Approach:** Property-based test using Vitest + fast-check. Generate arbitrary path strings. For each path, render `<ProtectedRoute>` with `isAuthenticated=false` and assert the rendered output is a redirect to `/login`.

**Why property test:** The redirect must hold for all possible paths, not just `/dashboard`. 100 iterations with random paths will surface edge cases (empty string, special characters, deeply nested paths).

```typescript
// Pseudocode
fc.assert(fc.property(
  fc.webPath(),
  (path) => {
    render(<MockRouter initialPath={path}><ProtectedRoute><div /></ProtectedRoute></MockRouter>, {
      authState: { isAuthenticated: false }
    });
    expect(screen.getByTestId("redirect")).toHaveAttribute("href", expect.stringContaining("/login"));
  }
));
```

### Property 2: Logout State Invariant (Property-Based)

**Criterion:** After `logout()` is called, `isAuthenticated` is always `false` and `user` is always `null`, regardless of prior session state.

**Approach:** Property-based test. Generate arbitrary prior auth states (various user objects, various `isAuthenticated` values). Call `logout()` and assert the resulting state is always `{ isAuthenticated: false, user: null }`.

**Why property test:** The invariant must hold from any starting state, not just a clean login. Varied prior states catch edge cases in the Cognito SDK's local storage cleanup.

```typescript
// Pseudocode
fc.assert(fc.property(
  fc.record({ email: fc.emailAddress(), username: fc.string() }),
  (priorUser) => {
    const { result } = renderHook(() => useAuth());
    act(() => { /* set prior state */ });
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  }
));
```

### Example Test 1: Provider Tree Completeness

**Criterion:** `QueryClientProvider` is always present as an ancestor of any component calling `useQuery`.

**Approach:** Render the full `App` component tree and assert that `QueryClientProvider` is present. A component that calls `useQuery` without the provider throws — verify the error boundary catches it when the provider is intentionally removed.

### Example Test 2: Environment Variable Contract

**Criterion:** `client/.env.example` contains entries for all three required `VITE_` variables.

**Approach:** Read `client/.env.example` as a string and assert each key is present. Single deterministic test.

### Example Test 3: Authenticated Redirect from /login

**Criterion:** An authenticated user navigating to `/login` is redirected to `/dashboard`.

**Approach:** Render `App` with `isAuthenticated=true` and initial path `/login`. Assert the rendered location is `/dashboard`.

---

## ADR Reference

`docs/adr/001-custom-cognito-auth.md` must be created as part of this feature. It documents:

- **Context:** `tech.md` steering specifies `@aws-amplify/ui-react` for auth. The existing codebase uses `amazon-cognito-identity-js` directly.
- **Decision:** Retain the custom hook approach. The custom implementation provides full control over the Cognito flow, avoids Amplify UI's opinionated component model, and is already integrated with `api.ts` for JWT extraction.
- **Consequences:** The steering file remains aspirational for future consideration. Any future migration to Amplify UI requires an updated ADR.
