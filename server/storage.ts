import { 
  configurations, 
  analyses, 
  statistics,
  type Configuration, 
  type InsertConfiguration,
  type Analysis,
  type InsertAnalysis,
  type Statistics,
  type InsertStatistics
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private configurations: Map<number, Configuration>;
  private analyses: Map<number, Analysis>;
  private statistics: Map<number, Statistics>;
  private currentConfigId: number;
  private currentAnalysisId: number;
  private currentStatsId: number;

  constructor() {
    this.configurations = new Map();
    this.analyses = new Map();
    this.statistics = new Map();
    this.currentConfigId = 1;
    this.currentAnalysisId = 1;
    this.currentStatsId = 1;
    
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
      ...config,
      id,
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
      ...analysis,
      id,
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
}

export const storage = new MemStorage();
