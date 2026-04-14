import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, BrainCircuit, ArrowLeft } from "lucide-react";
import { useAuthContext } from "@/_core/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";

export default function SignUpPage() {
    const { signUp, isLoading } = useAuthContext();
    const [, navigate] = useLocation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name || !email || !password) {
            toast.error("Preencha todos os campos.");
            return;
        }
        try {
            const result = await signUp(email, password, name);
            // result.user.getUsername() returns the internal UUID used to register.
            // We must pass it to /verify so confirmRegistration uses the right username.
            const internalUsername = result.user.getUsername();
            toast.success("Conta criada! Verifique seu e-mail.");
            navigate(`/verify?email=${encodeURIComponent(email)}&username=${encodeURIComponent(internalUsername)}`);
        } catch (err) {
            toast.error((err as Error).message);
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
                        Criar conta
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                        Jarvis 2.0 — acesso ao bunker
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-slate-300 text-sm">Nome</Label>
                            <Input
                                id="name"
                                type="text"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-300 text-sm">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="voce@exemplo.com"
                                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-300 text-sm">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mín. 8 caracteres"
                                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 text-base transition-colors duration-200 mt-2"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta…</>
                            ) : (
                                "Criar conta"
                            )}
                        </Button>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors w-full justify-center mt-1"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Já tenho conta
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
