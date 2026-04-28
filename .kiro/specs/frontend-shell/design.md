# Design Document — frontend-shell

## Overview

This document describes the technical design for migrating and completing the Jarvis frontend shell. The goal is a bootable, authenticated, lint-clean React + Vite application under `client/` that:

- Removes `amazon-cognito-identity-js` and `wouter` entirely.
- Adopts AWS Amplify v6 (`aws-amplify/auth`, `@aws-amplify/ui-react`) for authentication.
- Adopts `react-router-dom` v6 for routing.
- Exposes two routes (`/login` and `/dashboard`) wired with all required providers at the root.
- Passes a full suite of correctness tests.

No cognitive features are included.

---

## Architecture

### Provider Tree

The application renders a single provider hierarchy. Every provider is instantiated once at the root and never re-instantiated on navigation.

```
<React.StrictMode>
  <AuthProvider>                    ← Amplify.configure() + session state
    <QueryClientProvider>           ← TanStack Query root
      <Toaster />                   ← sonner toast notifications (global)
      <App />                       ← BrowserRouter + Routes
    </QueryClientProvider>
  </AuthProvider>
</React.StrictMode>
```

`AuthProvider` is outermost because `ProtectedRoute` and `AppSidebar` both consume `useAuth()`. `QueryClientProvider` wraps `App` so that page components can call `useQuery` without additional setup. `<Toaster />` is a sibling of `<App />` inside `QueryClientProvider` so that toast notifications are available from any component in the tree.

### Routing

`react-router-dom` v6 is the router. Route matching is handled by `<Routes>` with explicit `<Route>` entries inside `<BrowserRouter>`.

```
/login        → LoginPage                    (public, no layout)
/dashboard    → ProtectedRoute
                  └─ DashboardLayout
                       └─ DashboardPage
*             → <Navigate to="/dashboard" />
```

`ProtectedRoute` calls `fetchAuthSession()` from `aws-amplify/auth`. When no valid tokens are present, it renders `<Navigate to="/login" replace />`. The `replace` flag prevents the login page from appearing in the browser history stack.

`LoginPage` handles the authenticated-user-at-login redirect: after `<Authenticator>` fires its `onSignIn` callback, `useNavigate` pushes to `/dashboard`.

### Auth Architecture

The application uses AWS Amplify v6 modular API exclusively. The custom `amazon-cognito-identity-js` hook is replaced entirely.

**Amplify.configure()** is called once inside `AuthProvider` on mount:

```typescript
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
      region: import.meta.env.VITE_AWS_REGION,
    },
  },
});
```

**Session restoration** uses `getCurrentUser()` and `fetchAuthSession()` from `aws-amplify/auth`. During initialization, `isLoading` is `true` and a full-screen spinner is rendered to prevent flash-of-login.

**Programmatic sign-out** calls `signOut()` from `aws-amplify/auth`, then clears `user` and `session` state.

**JWT retrieval** in `api.ts` uses `fetchAuthSession()` and reads `session.tokens?.idToken?.toString()`.

---

## Component Tree

```
main.tsx
└── React.StrictMode
    └── AuthProvider (_core/context/AuthContext.tsx)
        └── QueryClientProvider
            ├── Toaster (sonner)
            └── App (App.tsx)
                └── BrowserRouter
                    └── Routes
                        ├── Route path="/login"
                        │   └── LoginPage
                        ├── Route path="/dashboard"
                        │   └── ProtectedRoute
                        │       └── DashboardLayout
                        │           └── DashboardPage
                        └── Route path="*"
                            └── Navigate to="/dashboard"
```

---

## File Inventory

### Files to Create from Scratch

| File | Purpose |
|------|---------|
| `client/src/main.tsx` | Application entry point — mounts React root, wires providers, validates env vars |
| `client/src/App.tsx` | BrowserRouter + Routes definitions |
| `client/src/_core/context/AuthContext.tsx` | AuthProvider with Amplify.configure(), session state, signOut |
| `client/src/_core/hooks/useAuth.ts` | Hook exposing `{ user, session, signOut, isLoading }` |
| `client/src/components/ProtectedRoute.tsx` | Route guard using fetchAuthSession |
| `client/src/pages/LoginPage.tsx` | Renders `<Authenticator>`, redirects to /dashboard on sign-in |
| `client/src/pages/DashboardPage.tsx` | Empty state placeholder for /dashboard |
| `client/package.json` | Frontend-specific package manifest with all deps and scripts |
| `client/tsconfig.json` | TypeScript config with path aliases, strict mode, bundler resolution |
| `client/vite.config.ts` | Vite config with @tailwindcss/vite plugin and @/ alias |
| `client/eslint.config.js` | ESLint v9 flat-config with TypeScript and React Hooks rules |
| `client/.env.example` | All four VITE_ vars with placeholder values |

### Files to Migrate (Modify)

| File | Change |
|------|--------|
| `client/src/lib/api.ts` | Replace `amazon-cognito-identity-js` with `fetchAuthSession` from `aws-amplify/auth` |
| `client/src/components/layout/AppSidebar.tsx` | Replace `wouter` with `react-router-dom`; replace `useAuthContext` with `useAuth` |

### Files to Keep (No Change Required)

| File | Role |
|------|------|
| `client/src/components/layout/DashboardLayout.tsx` | Layout wrapper — no auth coupling, no router coupling |
| `client/src/components/ErrorBoundary.tsx` | Error isolation |
| `client/src/components/ui/*` | shadcn/ui primitives |
| `client/src/hooks/use-mobile.tsx` | Responsive hook |
| `client/index.html` | HTML entry point (references `/src/main.tsx`) |

### Files to Add (shadcn/ui)

| File | Purpose |
|------|---------|
| `components.json` | shadcn/ui config at `client/` root |
| `client/src/components/ui/button.tsx` | Baseline shadcn/ui component |

---

## File Structure

```
client/
├── index.html                          # HTML entry (references /src/main.tsx)
├── components.json                     # NEW — shadcn/ui config
├── vite.config.ts                      # NEW — Vite config
├── tsconfig.json                       # NEW — TS config
├── package.json                        # NEW — frontend scripts + all deps
├── eslint.config.js                    # NEW — ESLint flat-config
├── .env.example                        # UPDATED — 4 VITE_ vars
└── src/
    ├── main.tsx                        # NEW — React root + providers
    ├── App.tsx                         # NEW — BrowserRouter + routes
    ├── index.css                       # EXISTING — Tailwind CSS directives
    ├── _core/
    │   ├── context/
    │   │   └── AuthContext.tsx         # NEW (replaces old Cognito version)
    │   └── hooks/
    │       └── useAuth.ts              # NEW (replaces old Cognito version)
    ├── components/
    │   ├── ProtectedRoute.tsx          # NEW (replaces wouter-based version)
    │   ├── ErrorBoundary.tsx           # EXISTING
    │   ├── layout/
    │   │   ├── DashboardLayout.tsx     # EXISTING (no change)
    │   │   └── AppSidebar.tsx          # MIGRATED (wouter → react-router-dom)
    │   └── ui/                         # EXISTING + button.tsx added
    ├── lib/
    │   └── api.ts                      # MIGRATED (cognito-js → aws-amplify/auth)
    ├── hooks/
    │   └── use-mobile.tsx              # EXISTING
    └── pages/
        ├── LoginPage.tsx               # NEW (replaces custom form)
        ├── DashboardPage.tsx           # NEW
        └── ...                         # EXISTING stubs (not routed in shell)
```

---

## Configuration Details

### client/vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

The `root` defaults to the directory containing `vite.config.ts` (i.e., `client/`). The `@/` alias maps to `./src` relative to the config file.

### client/tsconfig.json

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

`moduleResolution: "bundler"` is required by Amplify v6 and the mandatory stack.

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

`staleTime: 0` ensures data is always considered stale and re-fetched on mount, appropriate for the n8n webhook backend. `retry: 1` avoids hammering a potentially unavailable webhook endpoint.

### ESLint Configuration (eslint.config.js)

Uses the ESLint v9 flat-config format. Extends `@typescript-eslint/recommended` and `eslint-plugin-react-hooks`. Ignores `node_modules/`, `dist/`, and `*.config.*` files.

---

## Key Implementation Details

### AuthContext.tsx

```typescript
// Pseudocode — illustrates the contract
import { Amplify } from "aws-amplify";
import { getCurrentUser, fetchAuthSession, signOut as amplifySignOut } from "aws-amplify/auth";

Amplify.configure({ Auth: { Cognito: { ... } } }); // called once at module level or in useEffect

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const u = await getCurrentUser();
        const s = await fetchAuthSession();
        setUser(u); setSession(s);
      } catch { /* unauthenticated */ }
      finally { setIsLoading(false); }
    }
    restore();
  }, []);

  async function signOut() {
    await amplifySignOut();
    setUser(null); setSession(null);
  }

  if (isLoading) return <FullScreenSpinner />;
  return <AuthContext.Provider value={{ user, session, signOut, isLoading }}>{children}</AuthContext.Provider>;
}
```

### ProtectedRoute.tsx

```typescript
// Pseudocode
import { fetchAuthSession } from "aws-amplify/auth";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const [status, setStatus] = useState<"loading" | "auth" | "unauth">("loading");

  useEffect(() => {
    fetchAuthSession()
      .then(s => setStatus(s.tokens ? "auth" : "unauth"))
      .catch(() => setStatus("unauth"));
  }, []);

  if (status === "loading") return <LoadingSpinner />;
  if (status === "unauth") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

### LoginPage.tsx

```typescript
// Pseudocode
import { Authenticator } from "@aws-amplify/ui-react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="...">
      <h1>Sign in to your workspace</h1>
      <Authenticator onSignIn={() => navigate("/dashboard")} />
    </div>
  );
}
```

### api.ts Migration

```typescript
// Replace the CognitoUserPool block with:
import { fetchAuthSession } from "aws-amplify/auth";

async function getIdToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("No active session");
  return token;
}
```

### AppSidebar.tsx Migration

Replace:
- `import { Link, useLocation } from "wouter"` → `import { Link, useLocation } from "react-router-dom"`
- `import { useAuthContext } from "@/_core/context/AuthContext"` → `import { useAuth } from "@/_core/hooks/useAuth"`
- `const { logout, user } = useAuthContext()` → `const { signOut, user } = useAuth()`
- `logout()` → `signOut()`
- Toast message: `"Sessão encerrada."` → `"Your session has ended"`
- `<Link href={item.url}>` → `<Link to={item.url}>`
- `const [location] = useLocation()` → `const location = useLocation()` (react-router-dom returns an object)
- `location === item.url` → `location.pathname === item.url`

---

## Dependency Inventory

### Runtime Dependencies (client/package.json)

| Package | Version | Role |
|---------|---------|------|
| `react` | ^19 | UI framework |
| `react-dom` | ^19 | DOM renderer |
| `react-router-dom` | ^6 | Client-side router |
| `@aws-amplify/ui-react` | ^6 | Authenticator component |
| `aws-amplify` | ^6 | Amplify v6 modular API |
| `@tanstack/react-query` | ^5 | Server state management |
| `sonner` | ^2 | Toast notifications |
| `tailwindcss` | ^4 | CSS framework |
| `class-variance-authority` | ^0.7 | CVA for shadcn/ui |
| `clsx` | ^2 | Conditional class names |
| `tailwind-merge` | ^3 | Tailwind class merging |
| `lucide-react` | ^0.453 | Icon set |

### Dev Dependencies (client/package.json)

| Package | Version | Role |
|---------|---------|------|
| `vite` | ^7 | Build tool |
| `@vitejs/plugin-react` | ^5 | React fast refresh |
| `@tailwindcss/vite` | ^4 | Tailwind CSS Vite plugin |
| `typescript` | ^5 | Type checker |
| `vitest` | ^2 | Test runner |
| `@testing-library/react` | ^16 | Component testing |
| `@testing-library/jest-dom` | ^6 | DOM matchers |
| `fast-check` | ^3 | Property-based testing |
| `eslint` | ^9 | Linter |
| `@typescript-eslint/eslint-plugin` | ^8 | TypeScript lint rules |
| `@typescript-eslint/parser` | ^8 | TypeScript parser for ESLint |
| `eslint-plugin-react-hooks` | ^5 | React Hooks lint rules |
| `globals` | ^15 | Global variable definitions |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | ReactDOM type definitions |
| `@types/node` | ^24 | Node.js type definitions |

---

## Environment Variable Table

| Variable | Required | Description | Placeholder |
|----------|----------|-------------|-------------|
| `VITE_AWS_REGION` | Yes | AWS region for Amplify configuration | `us-east-1` |
| `VITE_AWS_COGNITO_USER_POOL_ID` | Yes | AWS Cognito User Pool ID | `us-east-1_XXXXXXXXX` |
| `VITE_AWS_COGNITO_CLIENT_ID` | Yes | Cognito App Client ID | `your-cognito-client-id` |
| `VITE_WEBHOOK_URL` | Yes | n8n webhook base URL for task operations | `http://your-ec2-ip:5678/webhook/tasks` |

All four variables are validated at startup in `main.tsx`. Missing variables produce a `console.warn` identifying the variable by name.

---

## Correctness Properties

Based on the acceptance criteria in Requirement 17, the following properties are testable and must be covered by the test suite in `client/src/__tests__/`.

### Property 1: Route Protection Invariant (Property-Based)

**Criterion:** Unauthenticated access to any URL path always redirects to `/login`.

**Approach:** Property-based test using Vitest + fast-check. Generate arbitrary path strings using `fc.webPath()`. For each path, render `<ProtectedRoute>` with a mocked `fetchAuthSession` that returns no tokens, and assert the rendered output is `<Navigate to="/login" />`.

**Why property test:** The redirect must hold for all possible paths, not just `/dashboard`. 100 iterations with random paths surface edge cases (empty string, special characters, deeply nested paths).

```typescript
// Pseudocode
fc.assert(fc.property(
  fc.webPath(),
  async (path) => {
    mockFetchAuthSession.mockResolvedValue({ tokens: undefined });
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<ProtectedRoute><div /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(window.location.pathname).toBe("/login");
    });
  }
));
```

### Property 2: Sign-Out State Invariant (Property-Based)

**Criterion:** After `signOut()` is called from any prior authenticated state, `fetchAuthSession` returns no valid tokens and `getCurrentUser` throws.

**Approach:** Property-based test. Generate arbitrary prior auth states (various user objects with different email/username combinations). Call `signOut()` and assert the resulting state always has `user === null` and `session === null`.

**Why property test:** The invariant must hold from any starting state. Varied prior states catch edge cases in Amplify's local storage cleanup.

```typescript
// Pseudocode
fc.assert(fc.property(
  fc.record({ username: fc.string({ minLength: 1 }), userId: fc.uuid() }),
  async (priorUser) => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    // Seed prior state via mock
    act(() => { /* inject priorUser into context */ });
    await act(async () => { await result.current.signOut(); });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  }
));
```

### Example Test 1: Provider Tree Completeness

**Criterion:** `QueryClientProvider` is always present as an ancestor of any component calling `useQuery`.

**Approach:** Render the full `App` component tree and assert that a component calling `useQuery` does not throw. Separately, render the component without `QueryClientProvider` and assert the error boundary catches the missing-provider error.

### Example Test 2: Environment Variable Contract

**Criterion:** `client/.env.example` contains entries for all four required `VITE_` variables.

**Approach:** Read `client/.env.example` as a string and assert each of the four keys is present. Single deterministic test.

### Example Test 3: Authenticated Redirect from /login

**Criterion:** An authenticated user navigating to `/login` is always redirected to `/dashboard`.

**Approach:** Render `App` with a mocked `fetchAuthSession` returning valid tokens and initial path `/login`. Assert the rendered location is `/dashboard`.
