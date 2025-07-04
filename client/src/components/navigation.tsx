import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Settings, Home, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      description: "Report generation and viewing"
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Settings,
      description: "API configuration and settings"
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Telegram Intelligence</span>
            </div>
          </div>

          {/* Navigation Links and User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Info and Logout - Only show when authenticated */}
            {user && (
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-600">
                  Bienvenido, {user.username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}