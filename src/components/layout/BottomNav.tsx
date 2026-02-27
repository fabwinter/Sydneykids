import { Home, Map, Clock, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { triggerHaptic } from "@/lib/haptics";

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Map, label: "Map", path: "/map" },
  { icon: Clock, label: "Timeline", path: "/timeline" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around h-12 max-w-2xl mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => triggerHaptic("light")}
              className={`nav-tab flex-1 ${isActive ? "active" : ""}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
