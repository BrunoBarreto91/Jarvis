import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";

/**
 * TaskForm — Natural Language Ingestion Layer
 *
 * Captures raw user intent in free-form text and dispatches it
 * to the n8n workflow for AI-powered parsing and structuring.
 */
export function TaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);

    try {
      await api.createTask(description);
      if (onTaskCreated) onTaskCreated();
      setDescription("");
      toast.success("Tarefa enviada para o Jarvis!");
    } catch (error) {
      console.error("Communication failure with n8n workflow:", error);
      toast.error("Erro ao enviar tarefa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-sm border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-slate-700">
          O que está na sua mente agora?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Ex: Preciso revisar o orçamento da AWS amanhã cedo..."
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            className="min-h-[120px] text-base resize-none focus-visible:ring-1 focus-visible:ring-slate-400"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !description.trim()}
              className="bg-slate-900 text-white hover:bg-slate-800 px-8"
            >
              {isLoading ? "Enviando..." : "Registrar com Jarvis"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
