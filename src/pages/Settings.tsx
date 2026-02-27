import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  LogOut, 
  ChevronRight,
  Camera,
  Mail,
  Lock,
  Loader2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated, signOut } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.user_metadata?.name || "");
      setBio(profile.bio || "");
    }
  }, [profile, user]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: { name?: string; bio?: string; newsletter_opt_in?: boolean; marketing_opt_in?: boolean }) => {
      if (!profile?.id) throw new Error("No profile found");
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save settings",
      });
    },
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile.mutateAsync({ name, bio });
    setIsSaving(false);
  };

  const handleToggleNewsletter = async (checked: boolean) => {
    await updateProfile.mutateAsync({ newsletter_opt_in: checked });
  };

  const handleToggleMarketing = async (checked: boolean) => {
    await updateProfile.mutateAsync({ marketing_opt_in: checked });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const getInitials = () => {
    if (displayName.includes(" ")) {
      return displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return displayName.slice(0, 2).toUpperCase();
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button 
            onClick={() => navigate("/profile")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>

        {/* Profile Section */}
        <section className="px-4 py-6 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Profile
          </h2>
          
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Tell us about yourself..."
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/150</p>
            </div>

            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="px-4 py-6 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Notifications & Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Weekly Recommendations</p>
                  <p className="text-xs text-muted-foreground">Get activity suggestions via email</p>
                </div>
              </div>
              <Switch
                checked={profile?.newsletter_opt_in ?? false}
                onCheckedChange={handleToggleNewsletter}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-sm">Special Offers & Discounts</p>
                  <p className="text-xs text-muted-foreground">Partner deals (premium)</p>
                </div>
              </div>
              <Switch
                checked={profile?.marketing_opt_in ?? false}
                onCheckedChange={handleToggleMarketing}
              />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="px-4 py-6 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Account
          </h2>
          
          <div className="space-y-2">
            <SettingsItem
              icon={User}
              label="Account Information"
              description={user?.email}
              onClick={() => {}}
            />
            <SettingsItem
              icon={Lock}
              label="Change Password"
              description="Update your password"
              onClick={() => {
                toast({
                  title: "Password Reset",
                  description: "Check your email for password reset instructions",
                });
                supabase.auth.resetPasswordForEmail(user?.email || "");
              }}
            />
            <SettingsItem
              icon={Shield}
              label="Privacy"
              description="Manage your data and visibility"
              onClick={() => {}}
            />
          </div>
        </section>

        {/* Sign Out */}
        <section className="px-4 py-6">
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </section>
      </div>
    </AppLayout>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: any;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}
