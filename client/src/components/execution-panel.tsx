import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Rocket, AlertCircle, CheckCircle, Download, Share } from "lucide-react";

interface AnalysisResult {
  id: number;
  status: string;
  progress: number;
  currentStep: string | null;
  messagesCollected: number | null;
  channelsProcessed: number | null;
  report: any;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface Configuration {
  id: number;
  channels: string[];
  hasApiKeys: boolean;
}

export function ExecutionPanel() {
  const { toast } = useToast();
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get configuration
  const { data: configuration } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
  });

  // Get latest analysis
  const { data: latestAnalysis } = useQuery<AnalysisResult>({
    queryKey: ["/api/analysis"],
  });

  // Get current analysis status (when processing)
  const { data: currentAnalysis, refetch: refetchCurrentAnalysis } = useQuery<AnalysisResult | null>({
    queryKey: ["/api/analysis", currentAnalysisId],
    enabled: !!currentAnalysisId,
    refetchInterval: isProcessing ? 1000 : false, // More frequent updates (1 second)
    refetchOnWindowFocus: false,
    retry: 3,
  });

  const startAnalysisMutation = useMutation({
    mutationFn: async (): Promise<AnalysisResult> => {
      const response = await apiRequest("POST", "/api/analysis/start", {});
      return response.json();
    },
    onSuccess: (data: AnalysisResult) => {
      setCurrentAnalysisId(data.id);
      setIsProcessing(true);
      toast({
        title: "Análisis iniciado",
        description: "Recopilando mensajes de Telegram...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar el análisis",
        variant: "destructive",
      });
    },
  });

  // Monitor analysis completion
  useEffect(() => {
    if (currentAnalysis) {
      console.log('Analysis update:', {
        id: currentAnalysis.id,
        status: currentAnalysis.status,
        progress: currentAnalysis.progress,
        currentStep: currentAnalysis.currentStep
      });
      
      if (currentAnalysis.status === "completed") {
        setIsProcessing(false);
        setCurrentAnalysisId(null);
        toast({
          title: "Análisis completado",
          description: "El informe de inteligencia está listo",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
      } else if (currentAnalysis.status === "failed") {
        setIsProcessing(false);
        setCurrentAnalysisId(null);
        toast({
          title: "Análisis fallido",
          description: currentAnalysis.error || "Error durante el procesamiento",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
      }
    }
  }, [currentAnalysis, toast]);

  // Force refresh every 2 seconds when processing
  useEffect(() => {
    if (isProcessing && currentAnalysisId) {
      const interval = setInterval(() => {
        refetchCurrentAnalysis();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing, currentAnalysisId, refetchCurrentAnalysis]);

  const handleStartAnalysis = () => {
    if (!configuration?.hasApiKeys) {
      toast({
        title: "Configuración incompleta",
        description: "Configura las credenciales de API primero",
        variant: "destructive",
      });
      return;
    }
    startAnalysisMutation.mutate();
  };

  const analysisToShow = currentAnalysis || latestAnalysis;

  // Export report as JSON
  const handleExportReport = (analysis: AnalysisResult) => {
    if (!analysis?.report) {
      toast({
        title: "Error",
        description: "No hay informe disponible para exportar",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      id: analysis.id,
      timestamp: analysis.completedAt || analysis.startedAt,
      report: analysis.report,
      metadata: {
        messagesCollected: analysis.messagesCollected,
        channelsProcessed: analysis.channelsProcessed,
        exportedAt: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram-intelligence-report-${analysis.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado exitosamente",
      description: "El informe se ha descargado como archivo JSON",
    });
  };

  // Share report (copy to clipboard)
  const handleShareReport = async (analysis: AnalysisResult) => {
    if (!analysis?.report) {
      toast({
        title: "Error",
        description: "No hay informe disponible para compartir",
        variant: "destructive",
      });
      return;
    }

    let shareText = `🔍 INFORME DE INTELIGENCIA TELEGRAM\n`;
    shareText += `📅 ${new Date(analysis.completedAt || analysis.startedAt).toLocaleString()}\n\n`;
    
    if (analysis.report.topics?.length > 0) {
      shareText += `📋 TEMAS PRINCIPALES:\n\n`;
      analysis.report.topics.forEach((topic: any, index: number) => {
        shareText += `${index + 1}. ${topic.topic}\n`;
        shareText += `${topic.briefing}\n`;
        if (topic.keyPoints?.length > 0) {
          topic.keyPoints.forEach((point: string) => {
            shareText += `   • ${point}\n`;
          });
        }
        shareText += `\n`;
      });
    }

    if (analysis.report.metadata) {
      shareText += `📊 ESTADÍSTICAS:\n`;
      shareText += `• Mensajes analizados: ${analysis.report.metadata.totalMessages}\n`;
      shareText += `• Canales: ${analysis.report.metadata.channelsAnalyzed}\n`;
      shareText += `• Ventana temporal: ${analysis.report.metadata.timeRange}\n`;
      shareText += `• Tiempo de procesamiento: ${analysis.report.metadata.processingTime}\n`;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copiado al portapapeles",
        description: "El informe está listo para compartir",
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copiado al portapapeles",
        description: "El informe está listo para compartir",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Execution Control Card */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <i className="fas fa-play-circle text-green-500"></i>
            <h2 className="text-xl font-semibold text-gray-800">Control de Ejecución</h2>
          </div>

          {/* Configuration Status */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 text-blue-700">
              {configuration?.hasApiKeys ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Sistema configurado correctamente</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Configuración requerida</span>
                </>
              )}
            </div>
            <div className="mt-2 text-sm text-blue-600">
              {configuration?.hasApiKeys ? (
                <>
                  <div>✓ Credenciales API cargadas desde variables de entorno</div>
                  <div>✓ Canales: {configuration.channels.join(", ")}</div>
                  <div>✓ Ventana temporal: 60 minutos</div>
                </>
              ) : (
                <div>Configura las credenciales de Telegram y OpenAI en el panel de administración</div>
              )}
            </div>
          </div>

          {/* Start Analysis Button */}
          <Button
            onClick={handleStartAnalysis}
            disabled={!configuration?.hasApiKeys || isProcessing}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-3 text-lg"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <Rocket className="w-5 h-5 mr-3" />
            )}
            Iniciar Recopilación y Análisis
          </Button>

          {/* Progress Section */}
          {isProcessing && currentAnalysis && (
            <div className="mt-6 space-y-4 fade-in">
              {/* Progress Bar with percentage */}
              <div className="space-y-2">
                <Progress value={currentAnalysis.progress} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progreso</span>
                  <span>{currentAnalysis.progress}%</span>
                </div>
              </div>

              {/* Status Message */}
              <div className="text-center font-medium text-gray-700">
                {currentAnalysis.currentStep || "Procesando..."}
              </div>

              {/* Visual Step Indicators */}
              <div className="flex justify-center space-x-6 py-2">
                <div className={`flex flex-col items-center space-y-1 ${currentAnalysis.progress >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                  {currentAnalysis.progress >= 10 ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full animate-pulse" />}
                  <span className="text-xs">Conectar</span>
                </div>
                <div className={`flex flex-col items-center space-y-1 ${currentAnalysis.progress >= 30 ? 'text-green-600' : 'text-gray-400'}`}>
                  {currentAnalysis.progress >= 30 ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full animate-pulse" />}
                  <span className="text-xs">Recopilar</span>
                </div>
                <div className={`flex flex-col items-center space-y-1 ${currentAnalysis.progress >= 70 ? 'text-green-600' : 'text-gray-400'}`}>
                  {currentAnalysis.progress >= 70 ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full animate-pulse" />}
                  <span className="text-xs">Analizar</span>
                </div>
                <div className={`flex flex-col items-center space-y-1 ${currentAnalysis.progress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                  {currentAnalysis.progress >= 100 ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full animate-pulse" />}
                  <span className="text-xs">Completar</span>
                </div>
              </div>

              {/* Real-time Progress Indicator */}
              <div className="text-center text-sm text-gray-500 animate-pulse">
                {currentAnalysis.progress < 30 && "Conectando con Telegram..."}
                {currentAnalysis.progress >= 30 && currentAnalysis.progress < 70 && "Recolectando mensajes de todos los canales..."}
                {currentAnalysis.progress >= 70 && currentAnalysis.progress < 90 && "Procesando con inteligencia artificial..."}
                {currentAnalysis.progress >= 90 && "Generando informe final..."}
              </div>

              {/* Estimated Time */}
              <div className="text-center text-xs text-gray-400">
                {currentAnalysis.progress < 70 && "Tiempo estimado: 15-30 segundos"}
                {currentAnalysis.progress >= 70 && currentAnalysis.progress < 90 && "Analizando mensajes consolidados..."}
                {currentAnalysis.progress >= 90 && "Casi listo..."}
              </div>

              {/* Detailed Progress Info */}
              {(currentAnalysis.messagesCollected !== null || currentAnalysis.channelsProcessed !== null) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 space-y-1">
                    {currentAnalysis.channelsProcessed !== null && (
                      <div>Canales procesados: {currentAnalysis.channelsProcessed}</div>
                    )}
                    {currentAnalysis.messagesCollected !== null && (
                      <div>Mensajes recopilados: {currentAnalysis.messagesCollected}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display Card */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <i className="fas fa-chart-line text-orange-500"></i>
            <h2 className="text-xl font-semibold text-gray-800">Informe de Inteligencia</h2>
          </div>

          {analysisToShow?.report ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Último Análisis</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(analysisToShow.completedAt || analysisToShow.startedAt).toLocaleString()}
                  </span>
                </div>

                {/* Intelligence Report */}
                <div className="prose prose-sm max-w-none">
                  {/* Topics Section */}
                  {analysisToShow.report.topics && analysisToShow.report.topics.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <i className="fas fa-list mr-2"></i>
                        Temas Principales
                      </h4>
                      {analysisToShow.report.topics.map((topic: any, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                          <h5 className="font-semibold text-gray-800 mb-2">{topic.topic}</h5>
                          <p className="text-gray-700 mb-2">{topic.briefing}</p>
                          {topic.keyPoints && topic.keyPoints.length > 0 && (
                            <ul className="list-disc list-inside text-sm text-gray-600 mb-2">
                              {topic.keyPoints.map((point: string, pointIndex: number) => (
                                <li key={pointIndex}>{point}</li>
                              ))}
                            </ul>
                          )}
                          <div className="text-xs text-gray-500">
                            <span className="mr-3">⏱️ {topic.timeframe}</span>
                            <span>📊 {topic.sources} fuentes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}



                  {/* Metadata Section */}
                  {analysisToShow.report.metadata && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-600 mb-2 flex items-center">
                        <i className="fas fa-info-circle mr-2"></i>
                        Información del Análisis
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Mensajes analizados:</span>
                            <span className="font-medium ml-1">{analysisToShow.report.metadata.totalMessages}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Canales:</span>
                            <span className="font-medium ml-1">{analysisToShow.report.metadata.channelsAnalyzed}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Ventana temporal:</span>
                            <span className="font-medium ml-1">{analysisToShow.report.metadata.timeRange}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tiempo de procesamiento:</span>
                            <span className="font-medium ml-1">{analysisToShow.report.metadata.processingTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleExportReport(analysisToShow)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleShareReport(analysisToShow)}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay informes disponibles.</p>
              <p className="text-sm">Ejecuta un análisis para generar un informe.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}