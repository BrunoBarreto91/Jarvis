import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, BrainCircuit, ArrowLeft } from "lucide-react";
import {
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
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

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword({ username: email });
      toast.success("Code sent to your email.");
      setStep("reset");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!code || !newPassword) {
      toast.error("Please fill in the code and new password.");
      return;
    }
    setIsLoading(true);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
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
            {step === "email" ? "Forgot password" : "New password"}
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            {step === "email"
              ? "We will send a recovery code to your email"
              : (
                <>
                  Code sent to{" "}
                  <span className="text-slate-300">{email}</span>
                </>
              )}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-slate-300 text-sm"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 text-base transition-colors duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send code"
                )}
              </Button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors w-full justify-center"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleResetPassword}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="code"
                  className="text-slate-300 text-sm"
                >
                  Email code
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

              <div className="space-y-1.5">
                <Label
                  htmlFor="newPassword"
                  className="text-slate-300 text-sm"
                >
                  New password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Min. 8 characters"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 text-base transition-colors duration-200 mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors w-full justify-center"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
