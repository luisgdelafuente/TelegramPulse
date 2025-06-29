import { AdminPanel } from "@/components/admin-panel";
import { ExecutionPanel } from "@/components/execution-panel";
import { StatisticsDashboard } from "@/components/statistics-dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="gradient-bg text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <i className="fas fa-satellite-dish text-2xl"></i>
            <h1 className="text-2xl font-bold">Telegram Intelligence Aggregator</h1>
          </div>
          <p className="text-blue-100 mt-2">Agrega y analiza canales públicos de Telegram con IA</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Configuration Panel */}
          <AdminPanel />
          
          {/* Right Column: Execution and Results */}
          <ExecutionPanel />
        </div>

        {/* Statistics Dashboard */}
        <StatisticsDashboard />
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2024 Telegram Intelligence Aggregator. Desarrollado con Node.js y Express.</p>
          <p className="text-sm text-gray-400 mt-2">Versión 1.0.0 | Estado: Demo</p>
        </div>
      </footer>
    </div>
  );
}
