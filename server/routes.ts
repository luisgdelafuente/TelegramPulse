import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConfigurationSchema, insertAnalysisSchema } from "@shared/schema";
import { TelegramService } from "./services/telegram";
import { OpenAIService } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current configuration
  app.get("/api/configuration", async (req, res) => {
    try {
      let config = await storage.getConfiguration();
      
      // Auto-create configuration with environment variables if none exists
      if (!config && process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH && 
          process.env.TELEGRAM_PHONE && process.env.OPENAI_API_KEY) {
        config = await storage.createConfiguration({
          telegramApiId: process.env.TELEGRAM_API_ID,
          telegramApiHash: process.env.TELEGRAM_API_HASH,
          telegramPhone: process.env.TELEGRAM_PHONE,
          openaiApiKey: process.env.OPENAI_API_KEY,
          channels: ["@Slavyangrad", "@TheIslanderNews"],
        });
      }
      
      if (!config) {
        return res.json(null);
      }
      
      // Don't expose API keys in the response
      const safeConfig = {
        id: config.id,
        channels: config.channels,
        hasApiKeys: !!(config.telegramApiId && config.telegramApiHash && config.telegramPhone && config.openaiApiKey),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
      
      res.json(safeConfig);
    } catch (error) {
      res.status(500).json({ message: "Failed to get configuration" });
    }
  });

  // Create or update configuration
  app.post("/api/configuration", async (req, res) => {
    try {
      const validatedData = insertConfigurationSchema.parse(req.body);
      
      const existingConfig = await storage.getConfiguration();
      let config;
      
      if (existingConfig) {
        // If API keys are empty strings, keep existing values
        const updateData = {
          ...validatedData,
          telegramApiId: validatedData.telegramApiId || existingConfig.telegramApiId,
          telegramApiHash: validatedData.telegramApiHash || existingConfig.telegramApiHash,
          telegramPhone: validatedData.telegramPhone || existingConfig.telegramPhone,
          openaiApiKey: validatedData.openaiApiKey || existingConfig.openaiApiKey,
        };
        config = await storage.updateConfiguration(existingConfig.id, updateData);
      } else {
        config = await storage.createConfiguration(validatedData);
      }
      
      // Update statistics
      await storage.updateStatistics({
        activeChannels: config.channels.length,
      });
      
      res.json({ 
        id: config.id,
        channels: config.channels,
        hasApiKeys: true,
        message: "Configuration saved successfully" 
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save configuration" });
    }
  });

  // Test API connections
  app.post("/api/configuration/test", async (req, res) => {
    try {
      const { telegramApiId, telegramApiHash, telegramPhone, openaiApiKey } = req.body;
      
      if (!telegramApiId || !telegramApiHash || !telegramPhone || !openaiApiKey) {
        return res.status(400).json({ message: "All credentials are required (Telegram API ID, Hash, Phone and OpenAI API Key)" });
      }
      
      const telegramService = new TelegramService(telegramApiId, telegramApiHash, telegramPhone);
      const openaiService = new OpenAIService(openaiApiKey);
      
      const [telegramTest, openaiTest] = await Promise.all([
        telegramService.testConnection(),
        openaiService.testConnection(),
      ]);
      
      res.json({
        telegram: telegramTest,
        openai: openaiTest,
        success: telegramTest && openaiTest,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to test API connections" });
    }
  });

  // Start analysis
  app.post("/api/analysis/start", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      if (!config) {
        return res.status(400).json({ message: "No configuration found. Please configure API keys and channels first." });
      }
      
      if (!config.telegramApiId || !config.telegramApiHash || !config.telegramPhone || !config.openaiApiKey) {
        return res.status(400).json({ message: "API credentials not configured" });
      }
      
      if (config.channels.length === 0) {
        return res.status(400).json({ message: "No channels configured" });
      }
      
      const analysis = await storage.createAnalysis({ configId: config.id });
      
      // Start the analysis process asynchronously
      processAnalysis(analysis.id, config).catch(error => {
        console.error("Analysis process failed:", error);
        storage.updateAnalysis(analysis.id, {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        });
      });
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to start analysis" });
    }
  });

  // Get analysis status
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Get latest analysis
  app.get("/api/analysis", async (req, res) => {
    try {
      const analysis = await storage.getLatestAnalysis();
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to get latest analysis" });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analyses" });
    }
  });

  // Get statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processAnalysis(analysisId: number, config: any) {
  console.log(`Starting analysis ${analysisId} with config:`, { 
    telegramApiId: config.telegramApiId, 
    channels: config.channels, 
    hasOpenAI: !!config.openaiApiKey 
  });
  
  const telegramService = new TelegramService(config.telegramApiId, config.telegramApiHash, config.telegramPhone);
  const openaiService = new OpenAIService(config.openaiApiKey);
  
  try {
    // Update status: Starting
    console.log(`Updating analysis ${analysisId} to processing state`);
    await storage.updateAnalysis(analysisId, {
      status: "processing",
      progress: 10,
      currentStep: "Connecting to Telegram API...",
    });
    console.log(`Analysis ${analysisId} updated to processing state`);
    
    // Test Telegram connection
    const telegramConnected = await telegramService.testConnection();
    if (!telegramConnected) {
      throw new Error("Failed to connect to Telegram API");
    }
    
    await storage.updateAnalysis(analysisId, {
      progress: 20,
      currentStep: "Collecting messages from channels...",
    });
    
    // Collect messages with error handling
    let messages: any[] = [];
    try {
      messages = await telegramService.getRecentMessages(config.channels, 60);
    } catch (telegramError) {
      console.error('Telegram service failed:', telegramError);
      await storage.updateAnalysis(analysisId, {
        status: "failed",
        progress: 100,
        error: `Error conectando con Telegram: ${telegramError.message}. Verifica tus credenciales MTProto (API ID, Hash, teléfono) en my.telegram.org`,
        completedAt: new Date(),
      });
      return;
    }
    
    await storage.updateAnalysis(analysisId, {
      progress: 50,
      currentStep: "Processing content...",
      messagesCollected: messages.length,
      channelsProcessed: config.channels.length,
    });
    
    if (messages.length === 0) {
      console.log("No messages found in the last 60 minutes. This may be because:");
      console.log("1. The bot is not an administrator of the specified channels");
      console.log("2. No messages were posted in the last 60 minutes");
      console.log("3. The channels may not exist or be accessible");
      
      await storage.updateAnalysis(analysisId, {
        status: "failed",
        progress: 100,
        error: "No se encontraron mensajes en los últimos 60 minutos. PASOS REQUERIDOS: 1) Ve a cada canal de Telegram que configuraste, 2) Agrega tu bot como administrador con permisos de 'Leer mensajes', 3) Verifica que los nombres de canal sean correctos (ej: @nombrecanal), 4) Asegúrate de que haya actividad reciente en los canales.",
        completedAt: new Date(),
      });
      return;
    }
    
    await storage.updateAnalysis(analysisId, {
      progress: 70,
      currentStep: "Sending to OpenAI for analysis...",
    });
    
    // Generate intelligence report
    const report = await openaiService.generateIntelligenceReport(messages);
    
    await storage.updateAnalysis(analysisId, {
      progress: 90,
      currentStep: "Generating final report...",
    });
    
    // Complete analysis
    await storage.updateAnalysis(analysisId, {
      status: "completed",
      progress: 100,
      currentStep: "Analysis completed",
      report: report,
      completedAt: new Date(),
    });
    
    // Update statistics
    const currentStats = await storage.getStatistics();
    await storage.updateStatistics({
      messagesProcessed: (currentStats?.messagesProcessed || 0) + messages.length,
      aiAnalyses: (currentStats?.aiAnalyses || 0) + 1,
    });
    
  } catch (error) {
    await storage.updateAnalysis(analysisId, {
      status: "failed",
      error: error.message,
      completedAt: new Date(),
    });
    throw error;
  }
}
