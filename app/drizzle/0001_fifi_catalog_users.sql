CREATE TABLE `product_records` (
  `id` text PRIMARY KEY NOT NULL,
  `payload` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
  `user_id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `payload` text NOT NULL,
  `consent_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_history` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `payload` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `plan_history_user_created_idx` ON `plan_history` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `integration_sources` (
  `provider` text PRIMARY KEY NOT NULL,
  `payload` text NOT NULL,
  `updated_at` text NOT NULL
);
