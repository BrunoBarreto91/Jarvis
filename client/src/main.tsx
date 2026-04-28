import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/_core/context/AuthContext";
import App from "./App";

// Startup environment variable validation
const requiredEnvVars = [
  "VITE_AWS_REGION",
  "VITE_AWS_COGNITO_USER_POOL_ID",
  "VITE_AWS_COGNITO_CLIENT_ID",
  "VITE_WEBHOOK_URL",
] as const;

for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    console.warn(
      `[Jarvis] Missing required environment variable: ${key}. ` +
        `Check client/.env.example for the expected format.`
    );
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);
