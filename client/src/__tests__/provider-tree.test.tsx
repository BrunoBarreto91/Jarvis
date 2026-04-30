import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

// Mock aws-amplify
vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

vi.mock("aws-amplify/auth", () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error("Not authenticated")),
  fetchAuthSession: vi.fn().mockResolvedValue({ tokens: undefined }),
  signOut: vi.fn(),
}));

vi.mock("@aws-amplify/ui-react", () => ({
  Authenticator: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useAuthenticator: () => ({ authStatus: "unauthenticated" }),
}));

function ComponentUsingQuery() {
  const { data } = useQuery({ queryKey: ["test"], queryFn: () => "test-data" });
  return <div data-testid="query-result">{data ?? "loading"}</div>;
}

describe("Provider tree completeness", () => {
  it("QueryClientProvider is present and useQuery does not throw", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ComponentUsingQuery />
        </QueryClientProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId("query-result")).toBeDefined();
  });
});
