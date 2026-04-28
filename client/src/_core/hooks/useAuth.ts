import { useContext } from "react";
import { AuthContext } from "@/_core/context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
        "Wrap your component tree with <AuthProvider> from @/_core/context/AuthContext."
    );
  }
  return context;
}
