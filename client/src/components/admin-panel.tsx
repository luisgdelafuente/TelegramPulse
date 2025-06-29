import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function AdminPanel() {
  const { toast } = useToast();
  const [telegramApiKey, setTelegramApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [channels, setChannels] = useState("");

  // Get current configuration
  const { data: configuration } = useQuery({
    queryKey: ["/api/configuration"],
  });

  // Test API connections
  const testConnectionMutation = useMutation({
    mutationFn: async ({ telegramApiKey, openaiApiKey }: { telegramApiKey: string; openaiApiKey: string }) => {
      const response = await apiRequest("POST", "/api/configuration/test", {
        telegramApiKey,
        openaiApiKey,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Conexión exitosa",
          description: "Ambas APIs están funcionando correctamente.",
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
    mutationFn: async (data: { telegramApiKey: string; openaiApiKey: string; channels: string[] }) => {
      const response = await apiRequest("POST", "/api/configuration", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La configuración se ha guardado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    },
  });

  const handleSaveConfiguration = () => {
    if (!telegramApiKey.trim() || !openaiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa ambas API keys.",
        variant: "destructive",
      });
      return;
    }

    // Parse channels
    const channelList = channels
      .split(/[,\n]/)
      .map(channel => channel.trim())
      .filter(channel => channel.length > 0)
      .map(channel => channel.startsWith('@') ? channel : `@${channel}`);

    saveConfigMutation.mutate({
      telegramApiKey,
      openaiApiKey,
      channels: channelList,
    });
  };

  const handleTestConnections = () => {
    if (!telegramApiKey.trim() || !openaiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa ambas API keys para probar las conexiones.",
        variant: "destructive",
      });
      return;
    }

    testConnectionMutation.mutate({
      telegramApiKey,
      openaiApiKey,
    });
  };

  // Set default values from configuration
  useState(() => {
    if (configuration?.channels) {
      setChannels(configuration.channels.join(', '));
    }
  });

  const channelCount = channels
    .split(/[,\n]/)
    .map(channel => channel.trim())
    .filter(channel => channel.length > 0).length;

  return (
    <div className="space-y-6">
      {/* API Configuration Card */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <i className="fas fa-cog text-blue-500"></i>
            <h2 className="text-xl font-semibold text-gray-800">Configuración de API</h2>
          </div>

          <div className="space-y-4">
            {/* Telegram API Key */}
            <div>
              <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <i className="fab fa-telegram-plane text-blue-500"></i>
                <span>Telegram API Key</span>
              </Label>
              <Input
                type="password"
                placeholder="Ingresa tu API Key de Telegram"
                value={telegramApiKey}
                onChange={(e) => setTelegramApiKey(e.target.value)}
                className="transition-colors"
              />
            </div>

            {/* OpenAI API Key */}
            <div>
              <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-robot text-green-500"></i>
                <span>OpenAI API Key</span>
              </Label>
              <Input
                type="password"
                placeholder="Ingresa tu API Key de OpenAI"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="transition-colors"
              />
            </div>

            {/* Test Connection Button */}
            <Button
              onClick={handleTestConnections}
              disabled={testConnectionMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {testConnectionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <i className="fas fa-plug mr-2"></i>
              )}
              Probar Conexiones
            </Button>

            {/* Save Configuration Button */}
            <Button
              onClick={handleSaveConfiguration}
              disabled={saveConfigMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {saveConfigMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <i className="fas fa-save mr-2"></i>
              )}
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channels Configuration Card */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <i className="fas fa-list text-purple-500"></i>
            <h2 className="text-xl font-semibold text-gray-800">Canales de Telegram</h2>
          </div>

          <div className="space-y-4">
            {/* Channel List */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Lista de Canales Públicos
              </Label>
              <Textarea
                rows={6}
                placeholder="@canal1, @canal2, @canal3&#10;O uno por línea:&#10;@canal1&#10;@canal2&#10;@canal3"
                value={channels}
                onChange={(e) => setChannels(e.target.value)}
                className="resize-none transition-colors"
              />
            </div>

            {/* Channel Count Display */}
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Canales configurados:</span>
              <span className="font-semibold text-blue-600">{channelCount}</span>
            </div>

            {/* Configuration Status */}
            {configuration && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                {configuration.hasApiKeys ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={configuration.hasApiKeys ? "text-green-700" : "text-red-700"}>
                  {configuration.hasApiKeys ? "APIs configuradas" : "APIs no configuradas"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
