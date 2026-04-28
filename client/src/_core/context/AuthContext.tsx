import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Amplify } from "aws-amplify";
import {
  getCurrentUser,
  fetchAuthSession,
  signOut as amplifySignOut,
  type AuthUser,
} from "aws-amplify/auth";
import type { AuthSession } from "aws-amplify/auth";
import { Loader2 } from "lucide-react";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID as string,
    },
  },
});

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [currentUser, currentSession] = await Promise.all([
          getCurrentUser(),
          fetchAuthSession(),
        ]);
        setUser(currentUser);
        setSession(currentSession);
      } catch {
        // User is not authenticated — this is expected
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function signOut() {
    await amplifySignOut();
    setUser(null);
    setSession(null);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
