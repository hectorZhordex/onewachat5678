import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslateMessage } from "@workspace/api-client-react";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, SkipForward,
  Send, Maximize2, Minimize2, Languages, Loader2, MessageSquare
} from "lucide-react";

type ChatMessage = {
  id: string;
  sender: "me" | "partner";
  text: string;
  originalText?: string;
  translatedText?: string;
  showOriginal: boolean;
};

export default function Chat() {
  const { user, profile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const genderPref = searchParams.get("genderPref") || "any";
  const countryPref = searchParams.get("countryPref") || "any";
  const interestPref = searchParams.get("interestPref") === "true";
  const mode = (searchParams.get("mode") || "video") as "text" | "video";
  const isTextOnly = mode === "text";

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "searching" | "connected">("searching");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(true);

  const translateMessageMutation = useTranslateMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cleanupConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setPartnerId(null);
    setMessages([]);
  }, []);

  const createPeerConnection = useCallback((partnerSocketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice_candidate", { to: partnerSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  }, []);

  const joinQueue = useCallback(() => {
    setStatus("searching");
    cleanupConnection();
    socketRef.current?.emit("join_queue", {
      userId: user?.id,
      gender: profile?.gender,
      country: profile?.country,
      interests: profile?.interests,
      language: profile?.language,
      mode,
      filters: { genderPreference: genderPref, countryFilter: countryPref, interestMatch: interestPref }
    });
  }, [user, profile, genderPref, countryPref, interestPref, mode, cleanupConnection]);

  useEffect(() => {
    const setupAndConnect = async () => {
      // Only request camera/mic for video mode
      if (!isTextOnly) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        } catch {
          toast({ title: "Camera access denied", description: "Please allow camera access for video chat.", variant: "destructive" });
          setLocation("/home");
          return;
        }
      }

      const socket = io(window.location.origin, {
        path: "/api/socket.io",
        transports: ["websocket"]
      });
      socketRef.current = socket;

      socket.on("connect", () => { joinQueue(); });

      socket.on("match_found", async (data: { partnerId: string, initiator: boolean }) => {
        setStatus("connected");
        setPartnerId(data.partnerId);

        if (!isTextOnly) {
          const pc = createPeerConnection(data.partnerId);
          peerConnectionRef.current = pc;
          if (data.initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { to: data.partnerId, offer });
          }
        }
      });

      socket.on("offer", async (data: { from: string, offer: RTCSessionDescriptionInit }) => {
        if (isTextOnly) return;
        if (!peerConnectionRef.current) peerConnectionRef.current = createPeerConnection(data.from);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", { to: data.from, answer });
      });

      socket.on("answer", async (data: { answer: RTCSessionDescriptionInit }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      socket.on("ice_candidate", async (data: { candidate: RTCIceCandidateInit }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on("disconnect_peer", () => {
        toast({ title: "Partner disconnected" });
        joinQueue();
      });

      socket.on("chat_message", async (data: { from: string, message: string, originalLang: string }) => {
        let translatedText = data.message;
        let showOriginal = false;
        if (isTranslating && data.originalLang !== profile?.language) {
          try {
            const result = await translateMessageMutation.mutateAsync({
              data: { text: data.message, sourceLang: data.originalLang, targetLang: profile?.language || "en" }
            });
            translatedText = result.translatedText;
            showOriginal = true;
          } catch {}
        }
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: "partner",
          text: data.message,
          originalText: data.message,
          translatedText,
          showOriginal: !showOriginal
        }]);
      });

      return () => {
        socket.disconnect();
        cleanupConnection();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
      };
    };

    const cleanup = setupAndConnect();
    return () => { cleanup.then(fn => fn?.()); };
  }, []);

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micEnabled; });
    setMicEnabled(v => !v);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !cameraEnabled; });
    setCameraEnabled(v => !v);
  };

  const handleNext = () => {
    if (partnerId) socketRef.current?.emit("next", { to: partnerId });
    joinQueue();
  };

  const handleStop = () => {
    cleanupConnection();
    setLocation("/home");
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !partnerId) return;
    socketRef.current?.emit("chat_message", {
      to: partnerId,
      message: inputText,
      originalLang: profile?.language || "en"
    });
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: "me", text: inputText, showOriginal: true }]);
    setInputText("");
  };

  const toggleTranslate = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, showOriginal: !m.showOriginal } : m));
  };

  // ── TEXT-ONLY LAYOUT ──────────────────────────────────────────────────────
  if (isTextOnly) {
    return (
      <div className="h-screen w-full bg-background flex flex-col relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Text Chat</p>
              <p className={`text-xs ${status === "connected" ? "text-green-400" : "text-yellow-400"}`}>
                {status === "connected" ? "Connected" : "Searching..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-white/50 mr-3">
              <Languages className="w-4 h-4" />
              <span>Auto-translate</span>
              <Switch checked={isTranslating} onCheckedChange={setIsTranslating} className="scale-75" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={status === "searching"}
              className="border-white/10 hover:bg-white/10 text-white/80 text-xs"
              data-testid="button-next"
            >
              <SkipForward className="w-3.5 h-3.5 mr-1" /> Next
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              className="text-xs"
              data-testid="button-stop"
            >
              <PhoneOff className="w-3.5 h-3.5 mr-1" /> Leave
            </Button>
          </div>
        </div>

        {/* Searching overlay */}
        {status === "searching" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-32 h-32 border border-primary/40 rounded-full animate-pulse" />
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Looking for someone to chat with...</h2>
            <p className="text-white/50 mb-8 text-sm">Matching based on your preferences</p>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={handleStop}>
              Cancel
            </Button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {messages.length === 0 && status === "connected" && (
            <div className="flex items-center justify-center h-full text-white/30 text-sm italic">
              Say hello! 👋
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.sender === "me"
                  ? "bg-primary text-white rounded-tr-sm"
                  : "bg-white/10 text-white rounded-tl-sm"
              }`}>
                {msg.sender === "partner" && msg.translatedText && isTranslating ? (
                  <>
                    <p className="text-sm">{msg.showOriginal ? msg.originalText : msg.translatedText}</p>
                    <button onClick={() => toggleTranslate(msg.id)} className="text-[10px] mt-1 opacity-60 hover:opacity-100 underline">
                      {msg.showOriginal ? "Show translation" : "Show original"}
                    </button>
                  </>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-black/20">
          <div className="max-w-3xl mx-auto relative">
            <Input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={status === "connected" ? "Type a message..." : "Waiting for connection..."}
              disabled={status !== "connected"}
              className="glass-input pr-14 h-12 rounded-xl bg-black/40 border-white/10"
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || status !== "connected"}
              className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── VIDEO LAYOUT ──────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-black overflow-hidden flex flex-col md:flex-row relative">

      {/* Video Area */}
      <div className={`relative flex-1 bg-zinc-950 flex items-center justify-center ${isFullscreen ? "z-50 inset-0 absolute" : ""}`}>

        <video ref={remoteVideoRef} autoPlay playsInline
          className={`w-full h-full object-cover transition-opacity duration-500 ${status === "connected" ? "opacity-100" : "opacity-0"}`}
        />

        {/* Local PIP */}
        <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-[3/4] md:aspect-video rounded-xl overflow-hidden border border-white/20 shadow-2xl z-20">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
        </div>

        {/* Searching overlay */}
        {status === "searching" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-40 h-40 border border-primary/50 rounded-full animate-pulse-ring" />
              <div className="absolute w-32 h-32 border border-primary/70 rounded-full animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Searching for connection...</h2>
            <p className="text-white/60 mb-8 max-w-sm text-center">Finding someone who matches your preferences anywhere in the world.</p>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={handleStop} data-testid="button-cancel-search">
              Cancel Search
            </Button>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Button variant="ghost" size="icon"
            className={`rounded-xl ${micEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-destructive/20 text-destructive hover:bg-destructive/30"}`}
            onClick={toggleMic} data-testid="button-toggle-mic"
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon"
            className={`rounded-xl ${cameraEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-destructive/20 text-destructive hover:bg-destructive/30"}`}
            onClick={toggleCamera} data-testid="button-toggle-camera"
          >
            {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          <div className="w-[1px] h-8 bg-white/10 mx-1" />
          <Button className="rounded-xl bg-destructive hover:bg-destructive/90 text-white w-14" onClick={handleStop} data-testid="button-stop">
            <PhoneOff className="w-5 h-5" />
          </Button>
          <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white font-medium px-6" onClick={handleNext} data-testid="button-next">
            Next <SkipForward className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Side Chat Panel */}
      <div className={`w-full md:w-[350px] lg:w-[400px] h-1/3 md:h-full bg-card border-l border-white/5 flex flex-col ${isFullscreen ? "hidden" : ""}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <h3 className="font-semibold text-white/90">Live Chat</h3>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-white/50" />
            <Switch checked={isTranslating} onCheckedChange={setIsTranslating} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                msg.sender === "me" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary text-secondary-foreground rounded-tl-sm"
              }`}>
                {msg.sender === "partner" && msg.translatedText && isTranslating ? (
                  <>
                    <p className="text-sm">{msg.showOriginal ? msg.originalText : msg.translatedText}</p>
                    <button onClick={() => toggleTranslate(msg.id)} className="text-[10px] mt-1 opacity-70 hover:opacity-100 transition-opacity underline">
                      {msg.showOriginal ? "Show translation" : "Show original"}
                    </button>
                  </>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
              </div>
            </div>
          ))}
          {status === "searching" && messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-white/30 text-sm italic text-center px-6">
              Messages will appear here once you connect with someone.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-black/20">
          <div className="relative">
            <Input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Type a message..."
              disabled={status !== "connected"}
              className="glass-input pr-12 h-12 rounded-xl bg-black/40 border-white/10"
              data-testid="input-chat-message"
            />
            <Button type="submit" size="icon" disabled={!inputText.trim() || status !== "connected"}
              className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
