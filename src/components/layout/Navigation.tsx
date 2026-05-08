import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Ship,
  Users,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  BarChart3
} from "lucide-react";
import { Anchor, CalendarClock, CalendarOff } from "lucide-react";

const navigation = [
  { name: "Kalender", href: "/admin", icon: Calendar },
  { name: "Boote", href: "/admin/boats", icon: Ship },
  { name: "Bootsführer", href: "/admin/captains", icon: Users },
  { name: "Tour-Typen", href: "/admin/tour-types", icon: Anchor },
  { name: "Öffentl. Termine", href: "/admin/public-tours", icon: CalendarClock },
];

const adminNavigation = [
  { name: "Berichte", href: "/admin/reports", icon: BarChart3 },
  { name: "Benutzer", href: "/admin/users", icon: Settings },
];

const captainNavigation = [
  { name: "Meine Abwesenheiten", href: "/captain/abwesenheiten", icon: CalendarOff },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-card z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/admin" className="flex items-center space-x-2">
              <Ship className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                Bootstour Manager
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {(user?.role === "admin" || user?.role === "staff" ? navigation : []).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2 transition-all duration-200",
                      isActive && "bg-primary text-primary-foreground shadow-button"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}

            {user?.role === "admin" && adminNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2 transition-all duration-200",
                      isActive && "bg-primary text-primary-foreground shadow-button"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}

            {(user?.role === "captain" || user?.role === "admin") && captainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.name} to={item.href}>
                  <Button variant={isActive ? "default" : "ghost"} className={cn("flex items-center space-x-2", isActive && "bg-primary text-primary-foreground")}>
                    <Icon className="h-4 w-4" /><span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}

            {user && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start space-x-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}

            {user?.role === "admin" && adminNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start space-x-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}

            {user && (
              <div className="border-t pt-2 mt-2">
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  Angemeldet als: {user.name}
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-2"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Abmelden</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}