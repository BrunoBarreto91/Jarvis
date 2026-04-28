import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { Loader2 } from "lucide-react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        setStatus(session.tokens ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        setStatus("unauthenticated");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
