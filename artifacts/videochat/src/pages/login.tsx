import React, { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import logo from "/logo.png";
import TermsModal from "@/components/terms-modal";
import CursorGlow from "@/components/cursor-glow";

const year = new Date().getFullYear();

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
        setLocation("/home");
      }
    } catch (err: any) {
      toast({ title: "Authentication failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#05060a" }}>

      {/* Terms modal */}
      <TermsModal />

      {/* Cursor glow — desktop only */}
      <CursorGlow />

      {/* Animated floating blobs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 420, height: 420,
          background: "#884cff",
          filter: "blur(120px)",
          opacity: 0.28,
          top: "10%", left: "15%",
          animation: "blob-float-1 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 320, height: 320,
          background: "#5b2fff",
          filter: "blur(110px)",
          opacity: 0.22,
          bottom: "12%", right: "12%",
          animation: "blob-float-2 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 250, height: 250,
          background: "#c040ff",
          filter: "blur(100px)",
          opacity: 0.16,
          top: "55%", left: "60%",
          animation: "blob-float-3 11s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 200, height: 200,
          background: "#884cff",
          filter: "blur(90px)",
          opacity: 0.14,
          top: "5%", right: "25%",
          animation: "blob-float-2 16s ease-in-out infinite reverse",
        }}
      />

      {/* Login card */}
      <div className="z-10 w-full max-w-md px-4">
        <div className="relative p-8 rounded-3xl animate-in fade-in zoom-in duration-700"
          style={{
            background: "rgba(12, 10, 22, 0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(136, 76, 255, 0.2)",
            boxShadow: "0 0 60px rgba(136, 76, 255, 0.15), 0 8px 32px rgba(0,0,0,0.6)",
          }}>

          {/* Purple glow behind card */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(136,76,255,0.12) 0%, transparent 60%)",
            }}
          />

          <div className="relative flex flex-col items-center mb-8">
            <img src={logo} alt="OneChat" className="w-14 h-14 object-contain mb-3 drop-shadow-[0_0_12px_rgba(136,76,255,0.6)]" />
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">OneChat</h1>
            <p className="text-white/50 text-sm">Meet the world. One click at a time.</p>
          </div>

          <form onSubmit={handleAuth} className="relative space-y-4">
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
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all"
              style={{ boxShadow: "0 0 20px rgba(136,76,255,0.4)" }}
              disabled={loading}
              data-testid="button-submit"
            >
              {loading && (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              )}
              {isRegistering ? "Create Account" : "Sign In"}
            </Button>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-primary/70 hover:text-primary transition-colors"
                data-testid="link-toggle-mode"
              >
                {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
              </button>
            </div>
          </form>

          <div className="relative mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-white/40">
            <ShieldCheck className="w-4 h-4 text-primary/50" />
            End-to-end encrypted peer connections
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="z-10 mt-8 text-center">
        <p className="text-xs text-white/25">
          © OneChat {year}. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
