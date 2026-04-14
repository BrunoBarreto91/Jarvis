import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Tasks table — Jarvis core entity
 * Stores all tasks with metadata for Life Management (Work, Personal, Health, Study)
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  frente: mysqlEnum("frente", ["trabalho", "pessoal", "saude", "estudo"]).notNull(),
  tipo: mysqlEnum("tipo", ["foco_profundo", "manutencao_vital", "rotina", "urgente"]).notNull(),
  status: mysqlEnum("status", ["todo", "doing", "blocked", "done"]).default("todo").notNull(),
  prazo: timestamp("prazo"),
  prioridade: mysqlEnum("prioridade", ["baixa", "media", "alta"]).default("media").notNull(),
  esforco: mysqlEnum("esforco", ["baixo", "medio", "alto"]).default("medio").notNull(),
  bloqueador: text("bloqueador"),
  notas: text("notas"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  completadoEm: timestamp("completadoEm"),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Task audit log — tracks status transitions
 */
export const taskLogs = mysqlTable("task_logs", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("userId", { length: 255 }).notNull(),
  statusAnterior: mysqlEnum("statusAnterior", ["todo", "doing", "blocked", "done"]),
  statusNovo: mysqlEnum("statusNovo", ["todo", "doing", "blocked", "done"]).notNull(),
  mudanca: varchar("mudanca", { length: 255 }),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

export type TaskLog = typeof taskLogs.$inferSelect;
export type InsertTaskLog = typeof taskLogs.$inferInsert;
