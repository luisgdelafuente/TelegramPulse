import { AdminPanel } from "@/components/admin-panel";
import { StatisticsDashboard } from "@/components/statistics-dashboard";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Admin() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

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