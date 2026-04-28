import { fetchAuthSession } from "aws-amplify/auth";

/** Retrieves the JWT ID Token from the active Cognito session. */
async function getIdToken(): Promise<string> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new Error("No active session");
    return token;
}

/** Returns base headers with injected Authorization token. */
async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getIdToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

export type Task = {
    id: string;
    description: string;
    status: 'todo' | 'doing' | 'blocked' | 'done' | 'scheduled';
    priority?: 'low' | 'medium' | 'high';
    context?: 'work' | 'personal' | 'study';
    createdAt?: string;
};

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || "http://localhost:5678/webhook/tasks";

interface ApiTask {
    id: string | number;
    title?: string;
    description?: string;
    status?: string;
    prioridade?: string;
    priority?: string;
    frente?: string;
    context?: string;
    criadoEm?: string;
    createdAt?: string;
    [key: string]: string | number | boolean | null | undefined;
}

/** Maps raw API responses (PT-BR keys) to the internal Task type. */
const sanitizeTask = (raw: ApiTask): Task => {
    let priority: Task['priority'] = 'medium';
    const rawPriority = (raw.prioridade || raw.priority || '').toLowerCase();
    if (rawPriority.includes('alta') || rawPriority.includes('high')) priority = 'high';
    else if (rawPriority.includes('baixa') || rawPriority.includes('low')) priority = 'low';

    let status: Task['status'] = 'todo';
    const rawStatus = (raw.status || '').toLowerCase();
    if (['agendado', 'scheduled', 'future', 'backlog'].some(s => rawStatus.includes(s))) {
        status = 'scheduled';
    } else if (['todo', 'doing', 'blocked', 'done'].includes(rawStatus)) {
        status = rawStatus as Task['status'];
    }

    let context: Task['context'] = 'work';
    const rawContext = (raw.frente || raw.context || '').toLowerCase();
    if (['work', 'personal', 'study'].includes(rawContext)) {
        context = rawContext as Task['context'];
    }

    return {
        id: String(raw.id),
        description: raw.title || raw.description || 'Sem descrição',
        status,
        priority,
        context,
        createdAt: raw.criadoEm || raw.createdAt || new Date().toISOString()
    };
};

export const api = {
    fetchTasks: async (): Promise<Task[]> => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(WEBHOOK_URL, { method: "GET", headers });
            if (!res.ok) throw new Error("Failed to fetch tasks");

            const data = await res.json();
            let rawList: ApiTask[] = Array.isArray(data) ? data : (data ? [data] : []);
            return rawList.map(sanitizeTask);
        } catch (error) {
            console.error("API Error (fetchTasks):", error);
            return [];
        }
    },

    createTask: async (description: string) => {
        const headers = await getAuthHeaders();
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ description, sessionId: "bruno_session_01" }),
        });
        if (!res.ok) throw new Error("Failed to create task");
        const text = await res.text();
        return text ? JSON.parse(text) : { success: true };
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        const headers = await getAuthHeaders();
        const res = await fetch(WEBHOOK_URL, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ id, ...updates }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        return await res.json();
    },

    deleteTask: async (id: string) => {
        const headers = await getAuthHeaders();
        const res = await fetch(WEBHOOK_URL, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Failed to delete task");
        return await res.json();
    },
};
