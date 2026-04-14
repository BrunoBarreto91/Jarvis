import { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = async () => {
        setLoading(true);
        const data = await api.fetchTasks();
        // Safety check
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        try {
            await api.deleteTask(id);
            toast.success("Tarefa excluída.");
            // Auto-refresh após ação (baixa carga cognitiva)
            setTimeout(() => loadTasks(), 800);
        } catch (e) {
            toast.error("Erro ao excluir.");
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await api.updateTask(id, { status: 'done' });
            toast.success("Tarefa concluída.");
            // Auto-refresh após ação (baixa carga cognitiva)
            setTimeout(() => loadTasks(), 800);
        } catch (e) {
            toast.error("Erro ao concluir.");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Todas as Tarefas</h1>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    Nenhuma tarefa encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.description}</TableCell>
                                    <TableCell>{task.status}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => handleComplete(task.id)}>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(task.id)}>
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
