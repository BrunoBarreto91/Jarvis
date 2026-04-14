import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, BrainCircuit } from "lucide-react";

const UNCONFIRMED = "Conta não confirmada. Verifique seu e-mail.";
import { useAuthContext } from "@/_core/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
    const { login, isLoading } = useAuthContext();
    const [, navigate] = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Preencha e-mail e senha.");
            return;
        }
        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            const msg = (err as Error).message;
            if (msg === UNCONFIRMED) {
                toast.info("Verifique seu e-mail antes de continuar.");
                navigate(`/verify?email=${encodeURIComponent(email)}`);
            } else {
                toast.error(msg);
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            {/* Subtle radial glow – purely decorative, zero cognitive load */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)",
                }}
            />

            <Card className="relative z-10 w-full max-w-sm border-slate-800 bg-slate-900 shadow-2xl">
                <CardHeader className="pb-2 text-center">
                    {/* Brand mark – single low-distraction icon */}
                    <div className="flex justify-center mb-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/20 ring-1 ring-violet-500/40">
                            <BrainCircuit className="h-6 w-6 text-violet-400" />
                        </span>
                    </div>
                    <CardTitle className="text-xl font-semibold text-slate-100">
                        Jarvis 2.0
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                        Bem-vindo de volta
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* E-mail */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-300 text-sm">
                                E-mail
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="voce@exemplo.com"
                                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        {/* Senha */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-300 text-sm">
                                Senha
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                                disabled={isLoading}
                            />
                        </div>

                        {/* CTA Button – proeminente, único, sem distrações */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 text-base transition-colors duration-200 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando…
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                        {/* Navegação discreta – links secundários */}
                        <div className="flex justify-between pt-1">
                            <button
                                type="button"
                                onClick={() => navigate("/signup")}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Criar conta
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Esqueci minha senha
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
