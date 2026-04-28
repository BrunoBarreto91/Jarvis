import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as fc from "fast-check";
import { AuthProvider } from "@/_core/context/AuthContext";
import { useAuth } from "@/_core/hooks/useAuth";

// Mock aws-amplify
vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

vi.mock("aws-amplify/auth", () => ({
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}));

import { getCurrentUser, fetchAuthSession, signOut as amplifySignOut } from "aws-amplify/auth";

describe("AuthProvider — sign-out state invariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always results in user=null and session=null after signOut, regardless of prior state", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 1 }),
          userId: fc.uuid(),
        }),
        async (priorUser) => {
          // Seed prior authenticated state
          (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(priorUser);
          (fetchAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({
            tokens: { idToken: { toString: () => "mock-token" } },
          });
          (amplifySignOut as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

          const { result, unmount } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
          });

          // Wait for session restoration to complete
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
          });

          // Call signOut
          await act(async () => {
            await result.current.signOut();
          });

          // Assert invariant: user and session are always null after signOut
          expect(result.current.user).toBeNull();
          expect(result.current.session).toBeNull();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });
});
