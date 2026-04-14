import { invokeLLM } from "./llm";

/**
 * NLP Task Parser — Adapter Pattern
 *
 * Receives raw natural language input and returns structured task data
 * using an LLM provider. The adapter interface allows swapping the
 * underlying model without changing consumer code.
 */

export interface ParsedTask {
  title: string;
  frente: "trabalho" | "pessoal" | "saude" | "estudo";
  local?: string;
  tipo: "foco_profundo" | "manutencao_vital" | "rotina" | "urgente";
  prazo?: Date;
  prioridade: "baixa" | "media" | "alta";
  esforco: "baixo" | "medio" | "alto";
  bloqueador?: string;
  notas?: string;
}

export interface ParseResult {
  success: boolean;
  task?: ParsedTask;
  preview: string;
  needsConfirmation: boolean;
  missingFields?: string[];
  suggestedValues?: Record<string, any>;
}

const SYSTEM_PROMPT = `You are Jarvis 2.0, an intelligent Exocortex assistant for Cognitive Management.
Your job is to interpret natural language task descriptions and extract structured information.

**Valid Enums:**
- frente: "trabalho", "pessoal", "saude", "estudo"
- tipo: "foco_profundo", "manutencao_vital", "rotina", "urgente"
- prioridade: "baixa", "media", "alta"
- esforco: "baixo", "medio", "alto"

**Parsing Rules:**
1. Always extract a clear, concise title (max 255 chars)
2. Infer frente from context (trabalho, pessoal, saude, estudo)
3. Infer tipo from task description keywords (depth, vital, routine, urgent)
4. Parse prazo (deadline) from relative dates like "today", "tomorrow", "next week", "D1", "D2", etc.
   - Return ISO 8601 date format (YYYY-MM-DD)
   - If no date specified, return null
5. Default prioridade to "media" if not specified
6. Default esforco to "medio" if not specified
7. Extract bloqueador (blocker) if mentioned
8. Extract local (context/place) if mentioned
9. Extract notas (notes) if additional context is provided

**Response Format:**
Return a JSON object with this structure:
{
  "success": true,
  "task": {
    "title": "string",
    "frente": "trabalho" | "pessoal" | "saude" | "estudo",
    "local": "string" | null,
    "tipo": "foco_profundo" | "manutencao_vital" | "rotina" | "urgente",
    "prazo": "YYYY-MM-DD" | null,
    "prioridade": "baixa" | "media" | "alta",
    "esforco": "baixo" | "medio" | "alto",
    "bloqueador": "string" | null,
    "notas": "string" | null
  },
  "missingFields": [],
  "suggestedValues": {}
}

If parsing fails or critical fields are missing, return:
{
  "success": false,
  "missingFields": ["field1", "field2"],
  "suggestedValues": { "field": "suggested_value" }
}`;

export async function parseNaturalLanguage(input: string): Promise<ParseResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Parse this task description: "${input}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "task_parser",
          strict: true,
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              task: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  frente: { type: "string", enum: ["trabalho", "pessoal", "saude", "estudo"] },
                  local: { type: "string", nullable: true },
                  tipo: { type: "string", enum: ["foco_profundo", "manutencao_vital", "rotina", "urgente"] },
                  prazo: { type: "string", nullable: true },
                  prioridade: { type: "string", enum: ["baixa", "media", "alta"] },
                  esforco: { type: "string", enum: ["baixo", "medio", "alto"] },
                  bloqueador: { type: "string", nullable: true },
                  notas: { type: "string", nullable: true },
                },
                required: ["title", "frente", "tipo", "prioridade", "esforco"],
              },
              missingFields: { type: "array", items: { type: "string" } },
              suggestedValues: { type: "object" },
            },
            required: ["success"],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    let contentStr = '';
    if (typeof content === 'string') {
      contentStr = content;
    } else if (Array.isArray(content)) {
      const textContent = content.find((c: any) => c.type === 'text') as any;
      contentStr = textContent?.text || '';
    }
    if (!contentStr) {
      return {
        success: false,
        preview: "Failed to parse task",
        needsConfirmation: false,
        missingFields: ["Unable to parse input"],
      };
    }

    const parsed = JSON.parse(contentStr);

    if (!parsed.success || !parsed.task) {
      return {
        success: false,
        preview: `Missing required fields: ${parsed.missingFields?.join(", ") || "unknown"}`,
        needsConfirmation: true,
        missingFields: parsed.missingFields || [],
        suggestedValues: parsed.suggestedValues || {},
      };
    }

    const task: ParsedTask = {
      title: parsed.task.title,
      frente: parsed.task.frente,
      local: parsed.task.local || undefined,
      tipo: parsed.task.tipo,
      prazo: parsed.task.prazo ? new Date(parsed.task.prazo) : undefined,
      prioridade: parsed.task.prioridade,
      esforco: parsed.task.esforco,
      bloqueador: parsed.task.bloqueador || undefined,
      notas: parsed.task.notas || undefined,
    };

    const preview = generatePreview(task);

    return {
      success: true,
      task,
      preview,
      needsConfirmation: false,
    };
  } catch (error) {
    console.error("[TaskParser] Error parsing natural language:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      preview: `Erro ao processar: ${errorMessage}. Por favor, tente novamente com mais detalhes.`,
      needsConfirmation: false,
      missingFields: ["Parse error"],
    };
  }
}

/** Formats a parsed task into a human-readable preview string. */
function generatePreview(task: ParsedTask): string {
  const parts = [
    `📌 Título: ${task.title}`,
    `📂 Frente: ${task.frente}`,
    `📍 Local: ${task.local || "Não especificado"}`,
    `🏷️ Tipo: ${task.tipo}`,
    task.prazo ? `📅 Prazo: ${task.prazo.toLocaleDateString("pt-BR")}` : "📅 Prazo: Não definido",
    `⭐ Prioridade: ${task.prioridade}`,
    `💪 Esforço: ${task.esforco}`,
  ];

  if (task.bloqueador) {
    parts.push(`🚧 Bloqueador: ${task.bloqueador}`);
  }

  if (task.notas) {
    parts.push(`📝 Notas: ${task.notas}`);
  }

  return parts.join("\n");
}
