import { 
  configurations, 
  analyses, 
  statistics,
  users,
  type Configuration, 
  type InsertConfiguration,
  type Analysis,
  type InsertAnalysis,
  type Statistics,
  type InsertStatistics,
  type User,
  type InsertUser
} from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Configuration methods
  getConfiguration(): Promise<Configuration | undefined>;
  createConfiguration(config: InsertConfiguration): Promise<Configuration>;
  updateConfiguration(id: number, config: Partial<InsertConfiguration>): Promise<Configuration>;
  
  // Analysis methods
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getLatestAnalysis(): Promise<Analysis | undefined>;
  getAllAnalyses(): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis>;
  
  // Statistics methods
  getStatistics(): Promise<Statistics | undefined>;
  updateStatistics(stats: Partial<InsertStatistics>): Promise<Statistics>;
  
  // User methods
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<User>;
}

export class MemStorage implements IStorage {
  private configurations: Map<number, Configuration>;
  private analyses: Map<number, Analysis>;
  private statistics: Map<number, Statistics>;
  private users: Map<number, User>;
  private currentConfigId: number;
  private currentAnalysisId: number;
  private currentStatsId: number;
  private currentUserId: number;

  constructor() {
    this.configurations = new Map();
    this.analyses = new Map();
    this.statistics = new Map();
    this.users = new Map();
    this.currentConfigId = 1;
    this.currentAnalysisId = 1;
    this.currentStatsId = 1;
    this.currentUserId = 1;
    
    // Initialize default statistics
    this.statistics.set(1, {
      id: 1,
      activeChannels: 0,
      messagesProcessed: 0,
      aiAnalyses: 0,
      lastUpdate: new Date(),
    });
  }

  async getConfiguration(): Promise<Configuration | undefined> {
    return Array.from(this.configurations.values())[0];
  }

  async createConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const id = this.currentConfigId++;
    const configuration: Configuration = {
      id,
      telegramApiId: config.telegramApiId,
      telegramApiHash: config.telegramApiHash,
      telegramPhone: config.telegramPhone,
      openaiApiKey: config.openaiApiKey,
      channels: config.channels || [],
      promptTemplate: config.promptTemplate || "Analyze the following Telegram messages and generate a concise intelligence report. Focus on key topics, events, and significant developments. Provide clear, factual briefings without sentiment analysis.",
      timeWindowMinutes: config.timeWindowMinutes || 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.configurations.set(id, configuration);
    return configuration;
  }

  async updateConfiguration(id: number, config: Partial<InsertConfiguration>): Promise<Configuration> {
    const existing = this.configurations.get(id);
    if (!existing) {
      throw new Error("Configuration not found");
    }
    
    const updated: Configuration = {
      ...existing,
      ...config,
      updatedAt: new Date(),
    };
    this.configurations.set(id, updated);
    return updated;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getLatestAnalysis(): Promise<Analysis | undefined> {
    const allAnalyses = Array.from(this.analyses.values());
    return allAnalyses.sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime())[0];
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).sort((a, b) => 
      new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()
    );
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentAnalysisId++;
    const newAnalysis: Analysis = {
      id,
      configId: analysis.configId || null,
      status: "pending",
      progress: 0,
      currentStep: null,
      messagesCollected: null,
      channelsProcessed: null,
      report: null,
      error: null,
      startedAt: new Date(),
      completedAt: null,
    };
    this.analyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis> {
    const existing = this.analyses.get(id);
    if (!existing) {
      throw new Error("Analysis not found");
    }
    
    const updated: Analysis = {
      ...existing,
      ...updates,
    };
    this.analyses.set(id, updated);
    return updated;
  }

  async getStatistics(): Promise<Statistics | undefined> {
    return this.statistics.get(1);
  }

  async updateStatistics(stats: Partial<InsertStatistics>): Promise<Statistics> {
    const existing = this.statistics.get(1);
    if (!existing) {
      throw new Error("Statistics not found");
    }
    
    const updated: Statistics = {
      ...existing,
      ...stats,
      lastUpdate: new Date(),
    };
    this.statistics.set(1, updated);
    return updated;
  }

  // User management methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = {
      id,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role || "admin",
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserLastLogin(id: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updated: User = {
      ...user,
      lastLogin: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }
}

export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // Configuration methods
  async getConfiguration(): Promise<Configuration | undefined> {
    const results = await this.db.select().from(configurations).limit(1);
    return results[0];
  }

  async createConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const [result] = await this.db.insert(configurations).values(config).returning();
    return result;
  }

  async updateConfiguration(id: number, config: Partial<InsertConfiguration>): Promise<Configuration> {
    const [result] = await this.db.update(configurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(configurations.id, id))
      .returning();
    if (!result) {
      throw new Error("Configuration not found");
    }
    return result;
  }

  // Analysis methods
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const results = await this.db.select().from(analyses).where(eq(analyses.id, id));
    return results[0];
  }

  async getLatestAnalysis(): Promise<Analysis | undefined> {
    const results = await this.db.select().from(analyses)
      .orderBy(desc(analyses.startedAt))
      .limit(1);
    return results[0];
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return await this.db.select().from(analyses).orderBy(desc(analyses.startedAt));
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [result] = await this.db.insert(analyses).values(analysis).returning();
    return result;
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis> {
    const [result] = await this.db.update(analyses)
      .set(updates)
      .where(eq(analyses.id, id))
      .returning();
    if (!result) {
      throw new Error("Analysis not found");
    }
    return result;
  }

  // Statistics methods
  async getStatistics(): Promise<Statistics | undefined> {
    const results = await this.db.select().from(statistics).limit(1);
    if (results.length === 0) {
      // Create default statistics if none exist
      const defaultStats = {
        activeChannels: 0,
        messagesProcessed: 0,
        aiAnalyses: 0,
      };
      const [created] = await this.db.insert(statistics).values(defaultStats).returning();
      return created;
    }
    return results[0];
  }

  async updateStatistics(stats: Partial<InsertStatistics>): Promise<Statistics> {
    // Get or create statistics first
    const existing = await this.getStatistics();
    if (!existing) {
      throw new Error("Failed to get or create statistics");
    }

    const [result] = await this.db.update(statistics)
      .set({ ...stats, lastUpdate: new Date() })
      .where(eq(statistics.id, existing.id))
      .returning();
    return result;
  }

  // User methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await this.db.insert(users).values(user).returning();
    return result;
  }

  async updateUserLastLogin(id: number): Promise<User> {
    const [result] = await this.db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!result) {
      throw new Error(`User with id ${id} not found`);
    }
    return result;
  }
}

// Use PostgreSQL storage in production, fallback to memory storage for development
export const storage = process.env.DATABASE_URL ? new PostgreSQLStorage() : new MemStorage();
