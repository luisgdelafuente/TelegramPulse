import { useState } from "react";
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

  // Get current configuration
  const { data: configuration } = useQuery({
    queryKey: ["/api/configuration"],
  });

  // Test API connections
  const testConnectionMutation = useMutation({
    mutationFn: async ({ telegramApiId, telegramApiHash, telegramPhone, openaiApiKey }: { 
      telegramApiId: string; 
      telegramApiHash: string; 
      telegramPhone: string; 
      openaiApiKey: string; 
    }) => {
      const response = await apiRequest("POST", "/api/configuration/test", {
        telegramApiId,
        telegramApiHash,
        telegramPhone,
        openaiApiKey,
      });
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
    mutationFn: async ({ telegramApiId, telegramApiHash, telegramPhone, openaiApiKey, channels }: { 
      telegramApiId: string; 
      telegramApiHash: string; 
      telegramPhone: string; 
      openaiApiKey: string; 
      channels: string[]; 
    }) => {
      const response = await apiRequest("POST", "/api/configuration", {
        telegramApiId,
        telegramApiHash,
        telegramPhone,
        openaiApiKey,
        channels,
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
    if (!telegramApiId || !telegramApiHash || !telegramPhone || !openaiApiKey) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todas las credenciales.",
        variant: "destructive",
      });
      return;
    }

    testConnectionMutation.mutate({
      telegramApiId,
      telegramApiHash,
      telegramPhone,
      openaiApiKey,
    });
  };

  const handleSaveConfiguration = () => {
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

    saveConfigMutation.mutate({
      telegramApiId,
      telegramApiHash,
      telegramPhone,
      openaiApiKey,
      channels: channelList,
    });
  };

  // Populate form with existing configuration
  React.useEffect(() => {
    if (configuration && configuration.channels) {
      setChannels(configuration.channels.join("\n"));
    }
  }, [configuration]);

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

      {/* Test Connection Button */}
      <div className="flex justify-center">
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
            </div>
          </div>
        </CardContent>
      </Card>

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