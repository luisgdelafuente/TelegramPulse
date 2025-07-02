import { AdminPanel } from "@/components/admin-panel";
import { StatisticsDashboard } from "@/components/statistics-dashboard";
import { Navigation } from "@/components/navigation";

export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-blue-100 mt-2">Configure API keys, channels, and system settings</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Configuration Panel */}
          <AdminPanel />
          
          {/* Statistics Dashboard */}
          <StatisticsDashboard />
        </div>
      </div>
    </div>
  );
}