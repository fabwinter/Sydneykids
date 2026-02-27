import { Bell, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Get user initials from email or name
  const getInitials = () => {
    if (!user) return "?";
    const email = user.email || "";
    const name = user.user_metadata?.name || user.user_metadata?.full_name || email;
    if (name && name.includes(" ")) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SP</span>
          </div>
          <span className="text-xl font-bold tracking-tight gradient-text">Sydney Planner</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
          )}
          
          {isLoading ? (
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <Link to="/profile">
              <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button asChild size="sm" variant="default">
              <Link to="/login" className="flex items-center gap-1.5">
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
