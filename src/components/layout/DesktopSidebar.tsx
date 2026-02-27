import { Home, Map, Clock, MessageCircle, User, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Map, label: "Map", path: "/map" },
  { icon: Clock, label: "Timeline", path: "/timeline" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
];

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-card/80 backdrop-blur-md border-r border-white/20 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">SP</span>
          </div>
          <span className="text-xl font-bold text-foreground">Sydney Planner</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border space-y-2">
        {user ? (
          <>
            <Link
              to="/profile"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === "/profile"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {profile?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-muted-foreground"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <Button
            className="w-full"
            onClick={() => navigate("/login")}
          >
            <User className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
    </aside>
  );
}
