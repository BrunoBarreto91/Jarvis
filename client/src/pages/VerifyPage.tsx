import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, BrainCircuit, ArrowLeft, RotateCcw } from "lucide-react";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const usernameFromQuery = searchParams.get("username") ?? emailFromQuery;

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code) {
      toast.error("Please enter the verification code.");
      return;
    }
    if (!usernameFromQuery) {
      toast.error(
        "Verification data incomplete. Please try creating the account again."
      );
      return;
    }
    setIsLoading(true);
    try {
      await confirmSignUp({ username: usernameFromQuery, confirmationCode: code });
      toast.success("Email verified! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!usernameFromQuery) {
      toast.error("Email not provided. Please go back and try again.");
      return;
    }
    setResending(true);
    try {
      await resendSignUpCode({ username: usernameFromQuery });
      toast.success("New code sent to your email.");
    } catch {
      toast.info("If the email exists, a new code was sent.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.10) 0%, transparent 70%)",
        }}
      />

      <Card className="relative z-10 w-full max-w-sm border-slate-800 bg-slate-900 shadow-2xl">
        <CardHeader className="pb-2 text-center">
          <div className="flex justify-center mb-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/20 ring-1 ring-violet-500/40">
              <BrainCircuit className="h-6 w-6 text-violet-400" />
            </span>
          </div>
          <CardTitle className="text-xl font-semibold text-slate-100">
            Verify email
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            {emailFromQuery ? (
              <>
                Code sent to{" "}
                <span className="text-slate-300">{emailFromQuery}</span>
              </>
            ) : (
              "Enter the code received by email"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-slate-300 text-sm">
                Verification code
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500 tracking-widest text-center text-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 text-base transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify"
              )}
            </Button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-violet-400 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resending ? "Resending…" : "Resend code"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
