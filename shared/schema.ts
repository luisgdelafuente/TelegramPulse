import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  telegramApiId: text("telegram_api_id").notNull(),
  telegramApiHash: text("telegram_api_hash").notNull(),
  telegramPhone: text("telegram_phone").notNull(),
  openaiApiKey: text("openai_api_key").notNull(),
  channels: text("channels").array().notNull().default([]),
  promptTemplate: text("prompt_template").notNull().default("Analyze the following Telegram messages and generate a concise intelligence report. Focus on key topics, events, and significant developments. Provide clear, factual briefings without sentiment analysis."),
  timeWindowMinutes: integer("time_window_minutes").notNull().default(60),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => configurations.id),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").notNull().default(0),
  currentStep: text("current_step"),
  messagesCollected: integer("messages_collected").default(0),
  channelsProcessed: integer("channels_processed").default(0),
  report: jsonb("report"),
  error: text("error"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  activeChannels: integer("active_channels").notNull().default(0),
  messagesProcessed: integer("messages_processed").notNull().default(0),
  aiAnalyses: integer("ai_analyses").notNull().default(0),
  lastUpdate: timestamp("last_update").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // admin role
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  configId: true,
});

export const insertStatisticsSchema = createInsertSchema(statistics).pick({
  activeChannels: true,
  messagesProcessed: true,
  aiAnalyses: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type Configuration = typeof configurations.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;
export type Statistics = typeof statistics.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
