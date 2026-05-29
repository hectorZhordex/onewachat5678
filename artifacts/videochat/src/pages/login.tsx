import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import logo from "/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Account created successfully. Please sign in." });
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // User is logged in, the ProtectedRoute or AuthContext will handle redirect
        setLocation("/home"); // Try to go home, will be intercepted if no profile
      }
    } catch (err: any) {
      toast({ title: "Authentication failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err: any) {
      const isNotEnabled = err.message?.includes("provider is not enabled") || err.message?.includes("Unsupported provider");
      toast({
        title: "Google login unavailable",
        description: isNotEnabled
          ? "Google sign-in is not yet configured. Please enable it in your Supabase dashboard under Authentication → Providers → Google."
          : err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent/10 rounded-full blur-[128px]" />
      
      <div className="z-10 w-full max-w-md p-8 rounded-3xl glass-panel animate-in fade-in zoom-in duration-700 relative">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="ChatSphere" className="w-14 h-14 object-contain mb-3" />
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">ChatSphere</h1>
          <p className="text-muted-foreground text-sm">Meet the world. One click at a time.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input h-12 bg-black/40 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50"
              data-testid="input-email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="glass-input h-12 bg-black/40 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50"
              data-testid="input-password"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)]"
            disabled={loading}
            data-testid="button-submit"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : null}
            {isRegistering ? "Create Account" : "Sign In"}
          </Button>
          
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-primary/80 hover:text-primary transition-colors"
              data-testid="link-toggle-mode"
            >
              {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
            </button>
          </div>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-white/10" />
          <span className="text-xs text-white/30 uppercase tracking-widest font-medium">Or continue with</span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        <Button 
          type="button" 
          onClick={handleGoogle}
          variant="outline" 
          className="w-full mt-6 h-12 glass-input hover:bg-white/5 border-white/10 text-white"
          data-testid="button-google"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary/60" />
          End-to-end encrypted peer connections
        </div>
      </div>
    </div>
  );
}
