import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const GUEST_DURATION = 120; // 2 minutes in seconds

export default function GuestTimer() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    // Logged-in users don't need the timer
    if (loading || user) {
      setSecondsLeft(null);
      return;
    }

    const raw = sessionStorage.getItem("guest_session_start");
    if (!raw) return; // Terms not accepted yet — TermsModal will handle this

    const tick = () => {
      const elapsed = Math.floor((Date.now() - Number(raw)) / 1000);
      const remaining = GUEST_DURATION - elapsed;

      if (remaining <= 0) {
        sessionStorage.removeItem("guest_session_start");
        setLocation("/login");
        return;
      }
      setSecondsLeft(remaining);
    };

    tick(); // Run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [user, loading, setLocation]);

  // Don't show anything if logged in or timer not running
  if (user || secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const isUrgent = secondsLeft <= 30;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9990] flex items-center justify-between px-4 py-2 text-sm transition-all"
      style={{
        background: isUrgent
          ? "rgba(180, 40, 40, 0.92)"
          : "rgba(30, 20, 60, 0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: isUrgent
          ? "1px solid rgba(255,80,80,0.3)"
          : "1px solid rgba(136,76,255,0.2)",
      }}
    >
      <div className="flex items-center gap-2 text-white/80">
        <Clock className={`w-4 h-4 ${isUrgent ? "text-red-400 animate-pulse" : "text-primary/70"}`} />
        <span>
          {isUrgent
            ? `Session ending in ${timeStr} — sign in to keep chatting`
            : `Free session: ${timeStr} remaining`}
        </span>
      </div>
      <Button
        size="sm"
        onClick={() => setLocation("/login")}
        className="h-7 px-3 text-xs bg-primary/80 hover:bg-primary text-white rounded-lg"
      >
        <LogIn className="w-3.5 h-3.5 mr-1" />
        Sign In
      </Button>
    </div>
  );
}
