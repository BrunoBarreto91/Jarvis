import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import * as fc from "fast-check";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock aws-amplify/auth
vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
}));

import { fetchAuthSession } from "aws-amplify/auth";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("ProtectedRoute — route protection invariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always redirects to /login when unauthenticated, for any path", async () => {
    await fc.assert(
      fc.asyncProperty(fc.webPath(), async (path) => {
        (fetchAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({
          tokens: undefined,
        });

        const { getByTestId, unmount } = render(
          <MemoryRouter initialEntries={[path || "/"]}>
            <Routes>
              <Route path="/login" element={<LocationDisplay />} />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <div>Protected content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(getByTestId("location").textContent).toBe("/login");
        });

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
