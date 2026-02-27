import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HamburgerMenu } from "./HamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useWeather } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

interface TopNavProps {
  variant?: "transparent" | "solid";
}

export function TopNav({ variant = "transparent" }: TopNavProps) {
  const { user, profile, isAuthenticated } = useAuth();
  const weather = useWeather();
  const isSolid = variant === "solid";

  const getInitials = () => {
    if (!profile?.name && !user?.email) return "?";
    const name = profile?.name || user?.email || "";
    if (name.includes(" ")) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-colors duration-300",
        isSolid 
          ? "bg-background/95 backdrop-blur-md border-b border-border" 
          : "bg-gradient-to-b from-black/40 to-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center border",
              isSolid 
                ? "bg-primary/10 border-primary/20" 
                : "bg-white/20 backdrop-blur-sm border-white/30"
            )}>
              <span className={cn("font-bold text-sm", isSolid ? "text-primary" : "text-white")}>SP</span>
            </div>
            <span className={cn(
              "text-xl font-bold tracking-tight",
              isSolid ? "text-foreground" : "text-white"
            )}>
              Sydney Planner
            </span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Weather */}
            {weather && (
              <div className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full",
                isSolid 
                  ? "bg-muted text-foreground" 
                  : "bg-white/15 backdrop-blur-sm text-white"
              )}>
                <span className="text-xs">Sydney</span>
                <span>{weather.icon}</span>
                <span>{weather.temp}°C</span>
              </div>
            )}

            {isAuthenticated ? (
              <Link to="/profile">
                <Avatar className={cn(
                  "w-9 h-9 ring-2 cursor-pointer transition-opacity hover:opacity-80",
                  isSolid ? "ring-primary/20" : "ring-white/30"
                )}>
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className={cn(
                    "text-sm font-semibold",
                    isSolid 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-white/20 text-white backdrop-blur-sm"
                  )}>
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className={cn(
                  "hidden sm:inline-flex",
                  !isSolid && "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                )}
              >
                <Link to="/login">Log in</Link>
              </Button>
            )}
            <HamburgerMenu variant={isSolid ? "solid" : "transparent"} />
          </div>
        </div>
      </div>
    </header>
  );
}
