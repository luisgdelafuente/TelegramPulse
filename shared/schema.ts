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

export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type Configuration = typeof configurations.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;
export type Statistics = typeof statistics.$inferSelect;
