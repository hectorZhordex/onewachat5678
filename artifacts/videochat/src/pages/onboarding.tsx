import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsertProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Sparkles, Languages } from "lucide-react";
import { ProfileInputGender } from "@workspace/api-client-react/src/generated/api.schemas";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/lib/supabase";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "ru", label: "Russian" },
  { value: "it", label: "Italian" },
  { value: "tr", label: "Turkish" },
  { value: "nl", label: "Dutch" },
  { value: "sv", label: "Swedish" },
  { value: "pl", label: "Polish" },
  { value: "vi", label: "Vietnamese" },
  { value: "th", label: "Thai" },
  { value: "id", label: "Indonesian" },
  { value: "fa", label: "Persian" },
];

export default function Onboarding() {
  const { user, profile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const upsertProfile = useUpsertProfile();

  const [username, setUsername] = useState(profile?.username || "");
  const [gender, setGender] = useState<ProfileInputGender | "">(profile?.gender as ProfileInputGender || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [language, setLanguage] = useState(profile?.language || "en");
  const [tagInput, setTagInput] = useState("");
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [countrySearch, setCountrySearch] = useState("");

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = COUNTRIES.find(c => c.name === country);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!interests.includes(newTag)) {
        setInterests([...interests, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setInterests(interests.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!username.trim() || !gender || !country) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    // Get fresh session to avoid race conditions after sign-in
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || user?.id || "";

    if (!userId) {
      toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
      setLocation("/login");
      return;
    }

    upsertProfile.mutate({
      data: {
        username,
        gender: gender as ProfileInputGender,
        country,
        interests,
        language
      },
      request: { headers: { 'x-user-id': userId } }
    }, {
      onSuccess: () => {
        toast({ title: "Profile saved!" });
        setLocation("/home");
      },
      onError: (err) => {
        toast({ title: "Failed to save profile", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl glass-panel rounded-3xl p-8 relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Your Persona</h1>
          <p className="text-muted-foreground">Setup your profile to find better matches.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">Username</label>
            <Input
              placeholder="e.g. NeonRider"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="glass-input h-12 bg-black/40 border-white/10"
              data-testid="input-username"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Gender</label>
              <Select value={gender} onValueChange={(v: ProfileInputGender) => setGender(v)}>
                <SelectTrigger className="glass-input h-12 bg-black/40 border-white/10" data-testid="select-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Location</label>
              <Select value={country} onValueChange={v => { setCountry(v); setCountrySearch(""); }}>
                <SelectTrigger className="glass-input h-12 bg-black/40 border-white/10" data-testid="select-country">
                  <span className="flex items-center gap-2 truncate">
                    {selectedCountry ? (
                      <>
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.name}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Select country</span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 max-h-72">
                  <div className="px-2 pb-2 pt-1 sticky top-0 bg-background/95 z-10">
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary/50"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                    />
                  </div>
                  {filteredCountries.map(c => (
                    <SelectItem key={c.code} value={c.name}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-4 py-3 text-sm text-muted-foreground">No countries found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">Primary Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="glass-input h-12 bg-black/40 border-white/10" data-testid="select-language">
                <Languages className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">Interests (Press Enter to add)</label>
            <div className="glass-input rounded-xl p-2 min-h-12 bg-black/40 border-white/10 focus-within:border-primary/50 focus-within:shadow-[0_0_15px_hsl(var(--primary)/0.2)] transition-all">
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-primary/20 text-primary-foreground px-3 py-1 rounded-full text-sm border border-primary/30">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-primary transition-colors focus:outline-none">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={interests.length === 0 ? "Type interests (e.g. music, travel, gaming)..." : ""}
                className="w-full bg-transparent outline-none text-white placeholder:text-white/30 p-1"
                data-testid="input-interests"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={upsertProfile.isPending}
          className="w-full h-14 mt-10 bg-primary hover:bg-primary/90 text-white rounded-xl text-lg font-medium shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-all"
          data-testid="button-save-profile"
        >
          {upsertProfile.isPending ? "Saving..." : (profile ? "Save Changes" : "Enter ChatSphere")}
        </Button>
      </div>
    </div>
  );
}
