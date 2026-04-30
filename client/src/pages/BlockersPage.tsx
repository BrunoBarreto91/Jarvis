import { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BlockersPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = async () => {
        setLoading(true);
        const all = await api.fetchTasks();
        const blocked = all.filter(t => t.status === 'blocked');
        setTasks(blocked);
        setLoading(false);
    };

    useEffect(() => { loadTasks(); }, []);

    const handleResolve = async (id: string) => {
        try {
            await api.updateTask(id, { status: 'todo' }); // Move back to todo
            toast.success("Desbloqueado! Movido para A Fazer.");
            // Auto-refresh após ação
            setTimeout(() => loadTasks(), 800);
        } catch {
            toast.error("Erro ao desbloquear.");
        }
    };

    const calculateDaysSince = (dateStr?: string): number => {
        if (!dateStr) return 0;
        const created = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-red-600">
                <AlertOctagon className="w-8 h-8" />
                <h1 className="text-2xl font-bold tracking-tight">Bloqueadores Ativos</h1>
            </div>

            {loading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.length === 0 ? (
                        <p className="text-slate-500">Nenhum bloqueador. Tudo fluindo! 🌊</p>
                    ) : (
                        tasks.map(task => {
                            const daysSince = calculateDaysSince(task.createdAt);

                            return (
                                <Card key={task.id} className="border-red-200 bg-red-50">
                                    <CardHeader>
                                        <CardTitle className="text-base text-red-800 mb-2">{task.description}</CardTitle>
                                        {daysSince > 0 && (
                                            <Badge variant="destructive" className="text-xs w-fit">
                                                Bloqueado há {daysSince} {daysSince === 1 ? 'dia' : 'dias'}
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            className="w-full bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                                            variant="outline"
                                            onClick={() => handleResolve(task.id)}
                                        >
                                            Resolver / Desbloquear
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
