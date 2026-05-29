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

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary/60" />
          End-to-end encrypted peer connections
        </div>
      </div>
    </div>
  );
}
