import { useState } from "react";
import { TaskForm } from "@/components/TaskForm";
import { FocusQueue } from "@/components/FocusQueue";

export default function ZenMode() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleTaskCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto space-y-10">
            <div className="w-full">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Zen Mode</h1>
                <TaskForm onTaskCreated={handleTaskCreated} />
            </div>

            <div className="w-full">
                <FocusQueue refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
}
