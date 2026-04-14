CREATE TABLE `task_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`statusAnterior` enum('todo','doing','blocked','done'),
	`statusNovo` enum('todo','doing','blocked','done') NOT NULL,
	`mudanca` varchar(255),
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`frente` enum('reativacao_ig','canais_venda') NOT NULL,
	`canal` enum('instagram','mercado_livre','shopee','tiktok_shop') NOT NULL,
	`tipo` enum('conteudo','cadastro_listing','politicas','logistica','criativos_ugc','ads') NOT NULL,
	`status` enum('todo','doing','blocked','done') NOT NULL DEFAULT 'todo',
	`prazo` timestamp,
	`prioridade` enum('baixa','media','alta') NOT NULL DEFAULT 'media',
	`esforco` enum('baixo','medio','alto') NOT NULL DEFAULT 'medio',
	`bloqueador` text,
	`notas` text,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`completadoEm` timestamp,
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `task_logs` ADD CONSTRAINT `task_logs_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_logs` ADD CONSTRAINT `task_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;