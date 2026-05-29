import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "onechat_terms_accepted";

export default function TermsModal() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Blurred overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        {/* Glow behind card */}
        <div className="absolute inset-0 rounded-3xl blur-2xl opacity-30 bg-[#884cff] scale-95 pointer-events-none" />

        <div className="relative rounded-3xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-[0_0_60px_rgba(136,76,255,0.25)] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Terms & Conditions</h2>
                <p className="text-xs text-white/50">Please read and accept before continuing</p>
              </div>
            </div>
          </div>

          {/* Scrollable terms */}
          <ScrollArea
            className="h-64 px-6 py-4"
            onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
              const el = e.currentTarget;
              const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
              if (atBottom) setScrolled(true);
            }}
          >
            <div className="space-y-4 text-sm text-white/70 leading-relaxed pr-2">
              <p>Welcome to <strong className="text-white">OneChat</strong>. By using this platform, you agree to these Terms & Conditions. Please read them carefully.</p>

              <div>
                <h3 className="font-semibold text-white mb-1">1. Eligibility</h3>
                <p>You must be at least 18 years old to use OneChat. By accessing this platform, you confirm that you meet this age requirement.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">2. Acceptable Use</h3>
                <p>You agree not to use OneChat to share illegal, harmful, explicit, abusive, hateful, or otherwise objectionable content. Any misuse may result in immediate termination of your account.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">3. Privacy & Data</h3>
                <p>We collect minimal data required to provide the service. Video and chat sessions are peer-to-peer and are not recorded or stored by our servers. Your IP address may be used to match you with other users.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">4. No Guarantee of Service</h3>
                <p>OneChat is provided "as is" without any warranties. We do not guarantee uninterrupted availability, specific match quality, or connection stability.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">5. Content Responsibility</h3>
                <p>You are solely responsible for anything you share during sessions. OneChat is not liable for any content shared by users on the platform.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">6. Prohibited Content</h3>
                <p>Nudity, sexual content, violence, harassment, hate speech, or any illegal material is strictly prohibited. Violations will result in an immediate ban.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">7. Modifications</h3>
                <p>OneChat reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">8. Termination</h3>
                <p>We reserve the right to suspend or terminate access to OneChat at any time, for any reason, without prior notice.</p>
              </div>

              <p className="text-white/40 text-xs pt-2">Last updated: 2026. OneChat — Dotcom One.</p>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAccept}
              className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-all"
              data-testid="button-accept-terms"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              I Accept — Enter OneChat
            </Button>
            <Button
              onClick={() => window.location.href = "about:blank"}
              variant="outline"
              className="flex-1 h-11 border-white/10 text-white/60 hover:bg-white/5 hover:text-white rounded-xl"
              data-testid="button-decline-terms"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
