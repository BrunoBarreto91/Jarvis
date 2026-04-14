import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { useAuthContext } from "@/_core/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    const { changePassword, deleteUser, isLoading } = useAuthContext();

    // ── Change Password state ────────────────────────────────────────────────
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ── Delete Account state ─────────────────────────────────────────────────
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");

    async function handleChangePassword(e: FormEvent) {
        e.preventDefault();
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error("Preencha todos os campos.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("A nova senha e a confirmação não coincidem.");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("A nova senha deve ter no mínimo 8 caracteres.");
            return;
        }
        try {
            await changePassword(oldPassword, newPassword);
            toast.success("Senha alterada com sucesso!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            toast.error((err as Error).message);
        }
    }

    async function handleDeleteUser(e: FormEvent) {
        e.preventDefault();
        if (!deletePassword) {
            toast.error("Confirme sua senha para excluir a conta.");
            return;
        }
        try {
            await deleteUser();
            toast.success("Conta excluída. Até logo.");
        } catch (err) {
            toast.error((err as Error).message);
        }
    }

    return (
        <div className="max-w-lg mx-auto space-y-8 py-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
                <p className="text-slate-500 text-sm mt-1">Gerencie sua conta Jarvis.</p>
            </div>

            {/* ── Seção: Segurança ─────────────────────────────────────────── */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-base font-semibold text-slate-800">Segurança</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400 text-sm">
                        Altere sua senha de acesso.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                        <div className="space-y-1.5">
                            <Label htmlFor="oldPassword" className="text-slate-700 text-sm">Senha atual</Label>
                            <Input
                                id="oldPassword"
                                type="password"
                                autoComplete="current-password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="newPassword" className="text-slate-700 text-sm">Nova senha</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mín. 8 caracteres"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword" className="text-slate-700 text-sm">Confirmar nova senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-violet-600 hover:bg-violet-500 text-white"
                        >
                            {isLoading
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando…</>
                                : "Salvar nova senha"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* ── Seção: Conta (zona de perigo) ────────────────────────────── */}
            <Card className="border-red-200 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <CardTitle className="text-base font-semibold text-red-700">Excluir conta</CardTitle>
                    </div>
                    <CardDescription className="text-slate-500 text-sm">
                        Esta ação é permanente e não pode ser desfeita.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!showDeleteConfirm ? (
                        <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Quero excluir minha conta
                        </Button>
                    ) : (
                        <form onSubmit={handleDeleteUser} className="space-y-4" noValidate>
                            <Separator className="bg-red-100" />
                            <p className="text-sm text-slate-600">
                                Para confirmar, insira sua senha atual:
                            </p>
                            <Input
                                id="deletePassword"
                                type="password"
                                autoComplete="current-password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Sua senha"
                                disabled={isLoading}
                                autoFocus
                                className="border-red-300 focus-visible:ring-red-400"
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading || !deletePassword}
                                    className="bg-red-600 hover:bg-red-500 text-white"
                                >
                                    {isLoading
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo…</>
                                        : "Excluir definitivamente"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                                    className="text-slate-500 hover:text-slate-700"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
