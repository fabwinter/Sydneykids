import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Login] onAuthStateChange:", event, !!session);
      if (session) {
        console.log("[Login] Redirecting to /home");
        navigate("/home", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Login] getSession:", !!session);
      if (session) {
        navigate("/home", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back! 👋",
          description: "Let's discover Sydney together",
        });
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: {
              newsletter_opt_in: newsletterOptIn,
              marketing_opt_in: marketingOptIn,
            }
          }
        });

        if (error) throw error;

        // If session is returned immediately, email confirmation is disabled — user is already in
        if (signUpData?.session) {
          toast({
            title: "Account created! 🎉",
            description: "Welcome to Sydney Planner!",
          });
          // onAuthStateChange in useEffect above will handle the redirect
        } else {
          toast({
            title: "Account created! 🎉",
            description: "Check your email (and spam folder) for a verification link.",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign in with Google",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address first",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for the reset link",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-br from-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-primary-foreground">SP</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">Sydney Planner</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Discover Sydney</p>
        </div>
      </div>
      
      {/* Form Section */}
      <div className="flex-1 px-6 py-8 -mt-6 bg-background rounded-t-3xl">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-8">
            {isLogin
              ? "Sign in to continue exploring"
              : "Join thousands discovering Sydney"}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-muted rounded-xl px-4 py-3.5 pl-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>
            
            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-muted rounded-xl px-4 py-3.5 pl-12 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {isLogin ? (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-primary font-medium hover:underline"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="newsletter"
                    checked={newsletterOptIn}
                    onCheckedChange={(checked) => setNewsletterOptIn(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="newsletter" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                    Send me weekly recommendations and updates about Sydney activities
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="marketing"
                    checked={marketingOptIn}
                    onCheckedChange={(checked) => setMarketingOptIn(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="marketing" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                    Receive special offers and partner discounts <span className="text-primary">(premium)</span>
                  </Label>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 py-6 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
          
          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          {/* Social Login */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 py-5"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 py-5"
              disabled={true}
              title="Apple Sign In coming soon"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
              Apple
            </Button>
          </div>
          
          {/* Guest Mode */}
          <button
            onClick={() => navigate("/")}
            className="w-full mt-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            Continue as guest →
          </button>
          
          {/* Toggle Login/Signup */}
          <p className="text-center text-sm mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-primary font-semibold hover:underline"
              disabled={isLoading}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
