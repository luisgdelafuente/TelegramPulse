import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export function StatisticsDashboard() {
  const { data: statistics } = useQuery({
    queryKey: ["/api/statistics"],
  });

  const formatLastUpdate = (date: string | Date) => {
    const now = new Date();
    const lastUpdate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Ahora";
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  return (
    <div className="mt-8">
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <i className="fas fa-chart-bar text-indigo-500"></i>
            <h2 className="text-xl font-semibold text-gray-800">Estadísticas de Uso</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-satellite-dish text-blue-500 text-xl"></i>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Canales Activos</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {statistics?.activeChannels || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-envelope text-green-500 text-xl"></i>
                <div>
                  <p className="text-sm text-green-600 font-medium">Mensajes Procesados</p>
                  <p className="text-2xl font-bold text-green-800">
                    {statistics?.messagesProcessed || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-brain text-purple-500 text-xl"></i>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Análisis IA</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {statistics?.aiAnalyses || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-clock text-orange-500 text-xl"></i>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Última Actualización</p>
                  <p className="text-sm font-bold text-orange-800">
                    {statistics?.lastUpdate ? formatLastUpdate(statistics.lastUpdate) : "Nunca"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
