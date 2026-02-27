import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import MapView from "./pages/MapView";
import Timeline from "./pages/Timeline";
import Chat from "./pages/Chat";
import ActivityDetails from "./pages/ActivityDetails";
import CategoryView from "./pages/CategoryView";
import WhatsOn from "./pages/WhatsOn";
import EventDetails from "./pages/EventDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/activity/:id" element={<ActivityDetails />} />
          <Route path="/explore" element={<CategoryView />} />
          <Route path="/whats-on" element={<WhatsOn />} />
          <Route path="/event/:id" element={<EventDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
