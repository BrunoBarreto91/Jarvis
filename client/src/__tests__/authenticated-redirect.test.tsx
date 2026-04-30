import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock aws-amplify
vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

vi.mock("aws-amplify/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ username: "testuser", userId: "test-id" }),
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: { idToken: { toString: () => "valid-token" } },
  }),
  signOut: vi.fn(),
}));

vi.mock("@aws-amplify/ui-react", () => {
  const Provider = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Authenticator = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  Authenticator.Provider = Provider;
  return {
    Authenticator,
    useAuthenticator: () => ({ authStatus: "authenticated" }),
  };
});

import { AuthProvider } from "@/_core/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("Authenticated redirect from /login", () => {
  it("redirects authenticated user from /login to /dashboard", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/login"]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <LocationDisplay />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthProvider>
    );

    await waitFor(
      () => {
        expect(getByTestId("location").textContent).toBe("/dashboard");
      },
      { timeout: 3000 }
    );
  });
});
