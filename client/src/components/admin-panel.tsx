import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdminPanel() {
  const { toast } = useToast();
  const [telegramApiId, setTelegramApiId] = useState("");
  const [telegramApiHash, setTelegramApiHash] = useState("");
  const [telegramPhone, setTelegramPhone] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [channels, setChannels] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(60);
  // Get current configuration with actual values
  const { data: configuration } = useQuery<{
    id: number;
    telegramApiId: string;
    telegramApiHash: string;
    telegramPhone: string;
    openaiApiKey: string;
    channels: string[];
    hasApiKeys: boolean;
    promptTemplate?: string;
    timeWindowMinutes?: number;
    createdAt?: string;
    updatedAt?: string;
  }>({
    queryKey: ["/api/configuration"],
  });

  // Get environment variables for auto-population (only when no config exists)
  const { data: envConfig } = useQuery<{
    telegramApiId: string;
    telegramApiHash: string;
    telegramPhone: string;
    openaiApiKey: string;
    channels: string[];
    promptTemplate: string;
    timeWindowMinutes: number;
  }>({
    queryKey: ["/api/configuration/env"],
    enabled: !configuration, // Only fetch when no configuration exists
  });

  // Test API connections
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/configuration/test", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Conexión exitosa",
          description: "Telegram MTProto y OpenAI están configurados correctamente.",
        });
      } else {
        toast({
          title: "Error de conexión",
          description: `Telegram: ${data.telegram ? "✓" : "✗"}, OpenAI: ${data.openai ? "✓" : "✗"}`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo probar la conexión con las APIs.",
        variant: "destructive",
      });
    },
  });

  // Save configuration
  const saveConfigMutation = useMutation({
    mutationFn: async ({ telegramApiId, telegramApiHash, telegramPhone, openaiApiKey, channels, promptTemplate, timeWindowMinutes }: { 
      telegramApiId: string; 
      telegramApiHash: string; 
      telegramPhone: string; 
      openaiApiKey: string; 
      channels: string[];
      promptTemplate: string;
      timeWindowMinutes: number;
    }) => {
      const response = await apiRequest("POST", "/api/configuration", {
        telegramApiId,
        telegramApiHash,
        telegramPhone,
        openaiApiKey,
        channels,
        promptTemplate,
        timeWindowMinutes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La configuración se guardó exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    // Test using stored configuration (backend will handle getting the right values)
    testConnectionMutation.mutate();
  };

  const handleSaveConfiguration = () => {
    // Validate required fields
    if (!telegramApiId || !telegramApiHash || !telegramPhone || !openaiApiKey) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todas las credenciales.",
        variant: "destructive",
      });
      return;
    }

    const channelList = channels
      .split("\n")
      .map((channel) => channel.trim())
      .filter((channel) => channel.length > 0);

    if (channelList.length === 0) {
      toast({
        title: "Sin canales",
        description: "Por favor agrega al menos un canal.",
        variant: "destructive",
      });
      return;
    }

    // Save all configuration values
    saveConfigMutation.mutate({
      telegramApiId,
      telegramApiHash,
      telegramPhone,
      openaiApiKey,
      channels: channelList,
      promptTemplate,
      timeWindowMinutes,
    });
  };

  // Populate form with actual stored values (no placeholders)
  React.useEffect(() => {
    if (configuration) {
      // Load stored configuration and show actual values
      setTelegramApiId(configuration.telegramApiId || "");
      setTelegramApiHash(configuration.telegramApiHash || "");
      setTelegramPhone(configuration.telegramPhone || "");
      setOpenaiApiKey(configuration.openaiApiKey || "");
      setChannels(configuration.channels ? configuration.channels.join("\n") : "");
      setPromptTemplate(configuration.promptTemplate || "Analyze the following Telegram messages and generate a concise report finding the main topics of discussion and writing a short briefing for each one, no bullets or lists.");
      setTimeWindowMinutes(configuration.timeWindowMinutes || 60);
    }
    
    // Only use environment variables if no configuration exists at all
    if (!configuration && envConfig) {
      setTelegramApiId(envConfig.telegramApiId);
      setTelegramApiHash(envConfig.telegramApiHash);
      setTelegramPhone(envConfig.telegramPhone);
      setOpenaiApiKey(envConfig.openaiApiKey);
      setChannels(envConfig.channels.join("\n"));
      setPromptTemplate(envConfig.promptTemplate);
      setTimeWindowMinutes(envConfig.timeWindowMinutes);
    }
  }, [configuration, envConfig]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configuración de APIs
        </h2>
        <p className="text-gray-600">
          Configura las credenciales para acceder a Telegram y OpenAI
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Nueva configuración MTProto:</strong> Para acceder a canales públicos de Telegram, 
          necesitas credenciales de usuario (no bot). Ve a <a href="https://my.telegram.org" target="_blank" className="text-blue-600 underline">my.telegram.org</a> para obtener API ID y API Hash.
        </AlertDescription>
      </Alert>

      {/* Show configuration status */}
      {envConfig && !configuration && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Configuración automática:</strong> Los campos se han llenado automáticamente desde las variables de entorno. Revisa y guarda la configuración.
          </AlertDescription>
        </Alert>
      )}
      
      {configuration && !configuration.hasApiKeys && !envConfig && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Primera configuración:</strong> Ingresa todas las credenciales de API para comenzar a usar la aplicación.
          </AlertDescription>
        </Alert>
      )}
      
      {configuration?.hasApiKeys && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Las API keys ya están configuradas. Para actualizarlas, ingresa nuevas credenciales y guarda.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Telegram Configuration */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Telegram MTProto
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="telegram-api-id">API ID</Label>
                    <Input
                      id="telegram-api-id"
                      type="text"
                      placeholder="12345678"
                      value={telegramApiId}
                      onChange={(e) => setTelegramApiId(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telegram-api-hash">API Hash</Label>
                    <Input
                      id="telegram-api-hash"
                      type="password"
                      placeholder="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
                      value={telegramApiHash}
                      onChange={(e) => setTelegramApiHash(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telegram-phone">Número de teléfono</Label>
                    <Input
                      id="telegram-phone"
                      type="text"
                      placeholder="+1234567890"
                      value={telegramPhone}
                      onChange={(e) => setTelegramPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OpenAI Configuration */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  OpenAI
                </h3>
                <div>
                  <Label htmlFor="openai-api-key">API Key</Label>
                  <Input
                    id="openai-api-key"
                    type="password"
                    placeholder="sk-..."
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Connection and Debug Section */}
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending}
            className="min-w-[200px]"
          >
            {testConnectionMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Probar Conexión
          </Button>
          
        </div>
      </div>

      {/* Channels Configuration */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Canales de Telegram
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ingresa los nombres de los canales públicos, uno por línea (ej: @nombrecanal)
              </p>
              <Textarea
                placeholder="@canal1&#10;@canal2&#10;@canal3"
                value={channels}
                onChange={(e) => setChannels(e.target.value)}
                rows={6}
              />
              {channels.split('\n').filter(c => c.trim()).length > 20 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Advertencia: Tienes más de 20 canales. El sistema procesará solo los primeros 20 para evitar timeouts.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* OpenAI Prompt Template */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  OpenAI Prompt Template
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Customize the prompt used for AI analysis of Telegram messages
                </p>
                <Textarea
                  placeholder="Analyze the following Telegram messages..."
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  rows={8}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Window Settings */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Analysis Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="time-window">Time Window (minutes)</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      How far back to collect messages for analysis
                    </p>
                    <Input
                      id="time-window"
                      type="number"
                      min="5"
                      max="1440"
                      placeholder="60"
                      value={timeWindowMinutes}
                      onChange={(e) => setTimeWindowMinutes(parseInt(e.target.value) || 60)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Range: 5 minutes to 24 hours (1440 minutes)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSaveConfiguration}
          disabled={saveConfigMutation.isPending}
          size="lg"
          className="min-w-[250px]"
        >
          {saveConfigMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Guardar Configuración
        </Button>
      </div>

      {/* Configuration Status */}
      {configuration?.hasApiKeys && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="mr-2 h-4 w-4" />
            APIs configuradas correctamente
          </div>
        </div>
      )}
    </div>
  );
}