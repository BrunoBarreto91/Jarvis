import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { useAuth, type UseAuthReturn } from "@/_core/hooks/useAuth";

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<UseAuthReturn | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const [initialising, setInitialising] = useState(true);

    // Validate stored session once on mount
    useEffect(() => {
        auth.checkAuth().finally(() => setInitialising(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Render nothing until we know session status to avoid flash-of-login
    if (initialising) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
export function useAuthContext(): UseAuthReturn {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
    return ctx;
}
