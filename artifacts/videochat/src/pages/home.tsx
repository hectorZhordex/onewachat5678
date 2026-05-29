import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Video, Settings, UserCircle, Users, Globe2, Sparkles, LogOut } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import logo from "/logo.png";

export default function Home() {
  const { profile, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [onlineCount, setOnlineCount] = useState(0);

  // Filters
  const [genderPreference, setGenderPreference] = useState("any");
  const [countryFilter, setCountryFilter] = useState("any");
  const [interestMatch, setInterestMatch] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    // Fake online count for UI demo, in a real app this would come from socket
    setOnlineCount(Math.floor(Math.random() * 5000) + 1000);
    const interval = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartChat = () => {
    // Pass filters via state or query params to chat
    const searchParams = new URLSearchParams({
      genderPref: genderPreference,
      countryPref: countryFilter,
      interestPref: interestMatch ? "true" : "false"
    });
    setLocation(`/chat?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[10%] right-[10%] w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[10%] left-[10%] w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12 z-10 glass-panel rounded-2xl px-6 py-4 mt-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="ChatSphere" className="w-9 h-9 object-contain" />
          <span className="text-xl font-bold tracking-tight">ChatSphere</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-white/80">{onlineCount.toLocaleString()} online</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={() => setLocation("/profile")} data-testid="button-profile">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/20 hover:text-destructive text-white/70" onClick={signOut} data-testid="button-logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Profile Summary Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center border-2 border-white/10 shadow-[0_0_20px_hsl(var(--primary)/0.2)] mb-4">
              <UserCircle className="w-12 h-12 text-white/80" />
            </div>
            <h2 className="text-2xl font-bold mb-1">{profile?.username}</h2>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <span className="capitalize">{profile?.gender}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{profile?.country}</span>
            </div>
            
            <div className="w-full flex flex-wrap justify-center gap-2">
              {profile?.interests?.map(interest => (
                <span key={interest} className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/80">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Action Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
            
            <div className="text-center mb-10 z-10">
              <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Ready to connect?</h2>
              <p className="text-muted-foreground text-lg">Your next great conversation is one click away.</p>
            </div>

            <Button 
              onClick={handleStartChat}
              className="group relative w-64 h-20 bg-primary hover:bg-primary/90 rounded-2xl text-xl font-bold shadow-[0_0_40px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.7)] transition-all duration-300 overflow-hidden"
              data-testid="button-start-chat"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-3">
                <Video className="w-6 h-6" />
                Start Chat
              </div>
            </Button>
          </div>

          {/* Match Filters */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Match Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Gender
                </label>
                <Select value={genderPreference} onValueChange={setGenderPreference}>
                  <SelectTrigger className="glass-input bg-black/40 border-white/10" data-testid="select-filter-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Globe2 className="w-4 h-4" /> Location
                </label>
                <Select value={countryFilter} onValueChange={v => { setCountryFilter(v); setCountrySearch(""); }}>
                  <SelectTrigger className="glass-input bg-black/40 border-white/10" data-testid="select-filter-country">
                    {countryFilter === "any" ? (
                      <span className="text-muted-foreground">Any country</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>{COUNTRIES.find(c => c.name === countryFilter)?.flag}</span>
                        <span>{countryFilter}</span>
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 max-h-64">
                    <div className="px-2 pb-2 pt-1 sticky top-0 bg-background/95 z-10">
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary/50"
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        onKeyDown={e => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="any">🌍 Any country</SelectItem>
                    {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                      <SelectItem key={c.code} value={c.name}>
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Common Interests
                </label>
                <div className="h-10 flex items-center justify-between px-4 glass-input bg-black/40 border-white/10 rounded-md">
                  <span className="text-sm text-white/80">Match interests</span>
                  <Switch 
                    checked={interestMatch} 
                    onCheckedChange={setInterestMatch} 
                    data-testid="switch-interest-match"
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
