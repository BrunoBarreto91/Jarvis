import { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertOctagon, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * FocusQueue — Zen Mode Task Feed
 *
 * Surfaces the top 3 actionable tasks (doing + todo) to reduce
 * decision paralysis. Provides inline actions for quick resolution.
 */
export function FocusQueue({ refreshTrigger }: { refreshTrigger?: number }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = async () => {
        setLoading(true);
        const allTasks = await api.fetchTasks();
        const safeTasks = Array.isArray(allTasks) ? allTasks : [];

        const zenTasks = safeTasks
            .filter(t => t.status === 'doing' || t.status === 'todo')
            .slice(0, 3);
        setTasks(zenTasks);
        setLoading(false);
    };

    useEffect(() => {
        loadTasks();
    }, [refreshTrigger]);

    const handleComplete = async (id: string) => {
        try {
            await api.updateTask(id, { status: 'done' });
            toast.success("Tarefa concluída!");
            loadTasks();
        } catch {
            toast.error("Erro ao concluir tarefa.");
        }
    };

    const handleBlock = async (id: string) => {
        try {
            await api.updateTask(id, { status: 'blocked' });
            toast.warning("Tarefa bloqueada.");
            loadTasks();
        } catch {
            toast.error("Erro ao bloquear tarefa.");
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center text-slate-400 text-sm mt-8">
                Nenhuma tarefa em foco. Respire fundo. 🍃
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-8 w-full max-w-lg mx-auto">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-center">Fila de Foco</h2>
            {tasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-slate-800 font-medium">{task.description}</span>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleComplete(task.id)} title="Concluir">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleBlock(task.id)} title="Bloquear">
                                <AlertOctagon className="w-5 h-5 text-red-500" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
