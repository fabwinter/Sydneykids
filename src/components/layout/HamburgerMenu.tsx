import { useState } from "react";
import { Menu, X, Home, Map, Clock, MessageCircle, User, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Map, label: "Map", path: "/map" },
  { icon: Clock, label: "Timeline", path: "/timeline" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

interface HamburgerMenuProps {
  variant?: "transparent" | "solid";
}

export function HamburgerMenu({ variant = "transparent" }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate("/login");
  };

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "p-2 rounded-lg transition-colors",
          variant === "solid" ? "hover:bg-muted" : "hover:bg-white/10"
        )}
        aria-label="Open menu"
      >
        <Menu className={cn("w-6 h-6", variant === "solid" ? "text-foreground" : "text-white")} />
      </button>

      {/* Overlay & Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                <span className="text-xl font-bold text-foreground">Sydney Planner</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(({ icon: Icon, label, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-colors text-left",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* User Section */}
              <div className="p-4 border-t border-border space-y-3 shrink-0">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {profile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {profile?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 justify-start gap-2"
                          onClick={() => handleNavClick("/settings")}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSignOut}
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleNavClick("/login")}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
