# API Reference

All endpoints require authentication via **AWS Cognito JWT** token in the `Authorization` header.

```
Authorization: Bearer <id_token>
```

## Base URL

```
http://<EC2_IP>:5678/webhook/tasks
```

---

## POST /tasks

Create a new task from natural language input.

**Request:**
```json
{
  "description": "Preciso revisar o orçamento da AWS amanhã, bem cedo",
  "sessionId": "user_session_id"
}
```

**Response (200):**
```json
{
  "id": 42,
  "title": "Revisar orçamento da AWS",
  "frente": "trabalho",
  "tipo": "foco_profundo",
  "prioridade": "alta",
  "nivel_energia": "medio",
  "duracao_estimada_minutos": 30,
  "notas": "Fazer cedo pela manhã"
}
```

The AI agent (Gemini Flash Lite) automatically parses the natural language input into 8 structured fields.

---

## GET /tasks

Retrieve all tasks for the authenticated user.

**Response (200):**
```json
[
  {
    "id": 42,
    "title": "Revisar orçamento da AWS",
    "status": "todo",
    "prioridade": "alta",
    "frente": "trabalho",
    "criadoEm": "2026-04-14T04:00:00.000Z"
  }
]
```

---

## PATCH /tasks

Update a task's status and optionally collect self-knowledge data on completion.

**Request:**
```json
{
  "id": 42,
  "status": "done",
  "custo_cognitivo_real": "alto",
  "sentimento_pos_conclusao": "Cansado, mas satisfeito com o progresso",
  "duracao_real_minutos": 45
}
```

**Response (200):**
```json
{
  "success": true,
  "completadoEm": "2026-04-14T05:00:00.000Z"
}
```

---

## DELETE /tasks

Remove a task permanently.

**Request:**
```json
{
  "id": 42
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Authentication

All endpoints are protected by AWS Cognito JWT validation. The flow:

1. Client authenticates with Cognito User Pool (email + password)
2. Receives `IdToken`, `AccessToken`, `RefreshToken`
3. Sends `IdToken` as Bearer token in each API request
4. n8n validates the JWT signature against Cognito's JWKS endpoint
