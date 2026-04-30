import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

function SignUpContent() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const navigate = useNavigate();

  useEffect(() => {
    if (authStatus === "authenticated") {
      navigate("/dashboard");
    }
  }, [authStatus, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-slate-100 text-center mb-6">
          Create your account
        </h1>
        <Authenticator initialState="signUp" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Authenticator.Provider>
      <SignUpContent />
    </Authenticator.Provider>
  );
}
