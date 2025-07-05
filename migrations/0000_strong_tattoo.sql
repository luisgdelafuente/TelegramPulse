CREATE TABLE "analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" text,
	"messages_collected" integer DEFAULT 0,
	"channels_processed" integer DEFAULT 0,
	"report" jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_api_id" text NOT NULL,
	"telegram_api_hash" text NOT NULL,
	"telegram_phone" text NOT NULL,
	"openai_api_key" text NOT NULL,
	"channels" text[] DEFAULT '{}' NOT NULL,
	"prompt_template" text DEFAULT 'Analyze the following Telegram messages and generate a concise intelligence report. Focus on key topics, events, and significant developments. Provide clear, factual briefings without sentiment analysis.' NOT NULL,
	"time_window_minutes" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"active_channels" integer DEFAULT 0 NOT NULL,
	"messages_processed" integer DEFAULT 0 NOT NULL,
	"ai_analyses" integer DEFAULT 0 NOT NULL,
	"last_update" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_config_id_configurations_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."configurations"("id") ON DELETE no action ON UPDATE no action;