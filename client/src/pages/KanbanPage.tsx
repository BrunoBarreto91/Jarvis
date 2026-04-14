import { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
    { id: 'scheduled', label: 'Agendado', color: 'bg-purple-50' },
    { id: 'todo', label: 'A Fazer', color: 'bg-slate-100' },
    { id: 'doing', label: 'Em Progresso', color: 'bg-blue-50' },
    { id: 'blocked', label: 'Bloqueado', color: 'bg-red-50' },
    { id: 'done', label: 'Concluído', color: 'bg-green-50' },
];

export default function KanbanPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = async () => {
        const data = await api.fetchTasks();
        setTasks(data);
        setLoading(false);
    };

    useEffect(() => {
        loadTasks();

        // Auto-refresh a cada 30s para sincronizar com n8n em background
        const interval = setInterval(() => {
            api.fetchTasks().then(setTasks);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full min-h-[500px]">
                {COLUMNS.map(col => {
                    const columnTasks = tasks.filter(t => t.status === col.id);

                    return (
                        <div key={col.id} className={`rounded-lg p-4 ${col.color} flex flex-col gap-3`}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm uppercase text-slate-600">{col.label}</h3>
                                <Badge variant="secondary">{columnTasks.length}</Badge>
                            </div>
                            <div className="flex-1 space-y-2">
                                {columnTasks.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center mt-8 italic">
                                        {col.id === 'scheduled' ? 'Nenhuma tarefa agendada' :
                                            col.id === 'todo' ? 'Tudo limpo! 🌊' :
                                                col.id === 'doing' ? 'Nenhuma em progresso' :
                                                    col.id === 'blocked' ? 'Sem bloqueios! ✨' :
                                                        'Concluídas aparecem aqui'}
                                    </p>
                                ) : (
                                    columnTasks.map(task => (
                                        <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                            <CardHeader className="p-3 pb-0">
                                                <CardTitle className="text-sm font-medium leading-none">
                                                    {task.priority && <Badge variant="outline" className="mb-2 text-[10px]">{task.priority}</Badge>}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-2">
                                                <p className="text-sm text-slate-700 line-clamp-3">{task.description}</p>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
