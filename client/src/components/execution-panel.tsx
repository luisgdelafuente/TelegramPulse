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

export function ExecutionPanel() {
  const { toast } = useToast();
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get configuration
  const { data: configuration } = useQuery({
    queryKey: ["/api/configuration"],
  });

  // Get latest analysis
  const { data: latestAnalysis } = useQuery({
    queryKey: ["/api/analysis"],
  });

  // Get current analysis status (when processing)
  const { data: currentAnalysis } = useQuery({
    queryKey: ["/api/analysis", currentAnalysisId],
    enabled: !!currentAnalysisId && isProcessing,
    refetchInterval: isProcessing ? 2000 : false,
  });

  // Start analysis mutation
  const startAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/analysis", {});
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentAnalysisId(data.id);
      setIsProcessing(true);
      toast({
        title: "Análisis iniciado",
        description: "El proceso de recopilación y análisis ha comenzado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar el análisis.",
        variant: "destructive",
      });
    },
  });

  // Monitor analysis completion
  useEffect(() => {
    if (currentAnalysis) {
      if (currentAnalysis.status === "completed") {
        setIsProcessing(false);
        setCurrentAnalysisId(null);
        queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
        queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
        toast({
          title: "Análisis completado",
          description: "El informe de inteligencia está listo.",
        });
      } else if (currentAnalysis.status === "failed") {
        setIsProcessing(false);
        setCurrentAnalysisId(null);
        toast({
          title: "Error en el análisis",
          description: currentAnalysis.error || "El análisis falló.",
          variant: "destructive",
        });
      }
    }
  }, [currentAnalysis, toast]);

  const handleStartAnalysis = () => {
    if (!configuration?.hasApiKeys) {
      toast({
        title: "Error",
        description: "Por favor, configura las API keys primero.",
        variant: "destructive",
      });
      return;
    }

    if (!configuration?.channels || configuration.channels.length === 0) {
      toast({
        title: "Error",
        description: "Por favor, configura al menos un canal.",
        variant: "destructive",
      });
      return;
    }

    startAnalysisMutation.mutate();
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>;
    }
    if (configuration?.hasApiKeys) {
      return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
    }
    return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
  };

  const getStatusText = () => {
    if (isProcessing) {
      return "Procesando...";
    }
    if (configuration?.hasApiKeys) {
      return "Sistema Listo";
    }
    return "Configuración Incompleta";
  };

  const getStatusColor = () => {
    if (isProcessing) {
      return "bg-blue-50 border-blue-200 text-blue-700";
    }
    if (configuration?.hasApiKeys) {
      return "bg-green-50 border-green-200 text-green-700";
    }
    return "bg-red-50 border-red-200 text-red-700";
  };

  const analysisToShow = currentAnalysis || latestAnalysis;

  return (
    <div className="space-y-6">
      {/* Execution Control Card */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <i className="fas fa-play-circle text-green-500"></i>
            <h2 className="text-xl font-semibold text-gray-800">Ejecutar Análisis</h2>
          </div>

          {/* Status Indicator */}
          <div className="mb-6">
            <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleStartAnalysis}
            disabled={isProcessing || startAnalysisMutation.isPending}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-6 text-lg h-auto shadow-lg"
          >
            {isProcessing || startAnalysisMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
            ) : (
              <Rocket className="w-5 h-5 mr-3" />
            )}
            Iniciar Recopilación y Análisis
          </Button>

          {/* Progress Section */}
          {isProcessing && currentAnalysis && (
            <div className="mt-6 space-y-4 fade-in">
              {/* Progress Bar */}
              <Progress value={currentAnalysis.progress} className="w-full" />

              {/* Status Message */}
              <div className="text-center font-medium text-gray-700">
                {currentAnalysis.currentStep || "Procesando..."}
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
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <i className="fas fa-chart-bar mr-2"></i>
                    Resumen Ejecutivo
                  </h4>
                  <p className="text-gray-700 mb-4">
                    {analysisToShow.report.executiveSummary}
                  </p>

                  <h4 className="font-semibold text-red-600 mb-2 flex items-center">
                    <i className="fas fa-trending-up mr-2"></i>
                    Tendencias Principales Detectadas
                  </h4>
                  <div className="space-y-2 mb-4">
                    {analysisToShow.report.mainTrends?.map((trend: any, index: number) => (
                      <div key={index} className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                        <strong className="text-red-800">{trend.title}</strong>
                        <span className="text-sm text-red-600 ml-2">({trend.sources} fuentes)</span>
                        <p className="text-sm text-gray-700 mt-1">{trend.description}</p>
                        <p className="text-xs text-red-600 mt-1"><strong>Impacto:</strong> {trend.impact}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-semibold text-orange-600 mb-2 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Eventos de Alto Impacto
                  </h4>
                  <div className="space-y-2 mb-4">
                    {analysisToShow.report.highImpactEvents?.map((event: any, index: number) => (
                      <div key={index} className="bg-orange-50 p-3 rounded border-l-4 border-orange-500">
                        <div className="flex items-center space-x-2">
                          <strong className="text-orange-800">{event.timestamp}</strong>
                          <span className="text-orange-700">-</span>
                          <strong className="text-orange-800">{event.event}</strong>
                          {event.crossChannelConfirmation && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">✓ Multi-canal</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-semibold text-purple-600 mb-2 flex items-center">
                    <i className="fas fa-project-diagram mr-2"></i>
                    Correlaciones Identificadas
                  </h4>
                  <div className="space-y-2 mb-4">
                    {analysisToShow.report.correlations?.map((correlation: any, index: number) => (
                      <div key={index} className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                        <strong className="text-purple-800">{correlation.pattern}</strong>
                        <p className="text-sm text-gray-700 mt-1">{correlation.description}</p>
                        <p className="text-xs text-purple-600 mt-1"><strong>Significancia:</strong> {correlation.significance}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-semibold text-blue-600 mb-2 flex items-center">
                    <i className="fas fa-heart mr-2"></i>
                    Análisis de Sentimiento
                  </h4>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500 mb-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-blue-800 font-medium">General:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        analysisToShow.report.sentimentAnalysis?.overall === 'positive' ? 'bg-green-100 text-green-800' :
                        analysisToShow.report.sentimentAnalysis?.overall === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {analysisToShow.report.sentimentAnalysis?.overall === 'positive' ? '🟢 Positivo' :
                         analysisToShow.report.sentimentAnalysis?.overall === 'negative' ? '🔴 Negativo' :
                         '🟡 Neutral'}
                      </span>
                      <span className="text-sm text-blue-600">
                        Confianza: {analysisToShow.report.sentimentAnalysis?.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{analysisToShow.report.sentimentAnalysis?.breakdown}</p>
                  </div>

                  <h4 className="font-semibold text-green-600 mb-2 flex items-center">
                    <i className="fas fa-bullseye mr-2"></i>
                    Recomendaciones Estratégicas
                  </h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {analysisToShow.report.recommendations?.map((rec: string, index: number) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Report Metadata */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Procesado con {analysisToShow.report.metadata?.model || "OpenAI GPT-4"}</span>
                    <span>Confiabilidad: {analysisToShow.report.confidence}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>Mensajes: {analysisToShow.report.metadata?.totalMessages}</span>
                    <span>Tiempo: {analysisToShow.report.metadata?.processingTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
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
