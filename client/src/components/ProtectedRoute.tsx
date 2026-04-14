import { useLocation, Redirect } from "wouter";
import { useAuthContext } from "@/_core/context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * Wraps any route that requires an authenticated session.
 * - Redirects to /login when the user is not authenticated.
 * - Preserves the intended destination in the URL so we can
 *   redirect back after a successful login (future enhancement).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated } = useAuthContext();
    const [location] = useLocation();

    if (!isAuthenticated) {
        return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
    }

    return <>{children}</>;
}
