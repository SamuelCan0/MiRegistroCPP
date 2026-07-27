CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`password_hash` text,
	`password_salt` text,
	`password_iterations` integer DEFAULT 210000 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
INSERT OR IGNORE INTO `users` (
	`id`,
	`email`,
	`display_name`,
	`role`,
	`password_hash`,
	`password_salt`,
	`password_iterations`
) VALUES (
	'primary-admin-samuel',
	'samuel-sistemas@colegiopedropalacios.edu.mx',
	'Samuel Sistemas',
	'admin',
	'Kh84Zym1dU1UNOAOf1GuVOCFDStWbdTFPSA1Cr6vcHY',
	'TRFXVnSMJBVXI4Yart1FLA',
	210000
);--> statement-breakpoint
ALTER TABLE `requests` ADD `created_by_user_id` text REFERENCES users(id);
