import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsertProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Globe2, ArrowLeft, Save } from "lucide-react";
import { ProfileInputGender } from "@workspace/api-client-react/src/generated/api.schemas";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", 
  "France", "Japan", "South Korea", "Brazil", "India", "Mexico", 
  "Spain", "Italy", "Netherlands", "Sweden", "Switzerland", "Other"
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "pt", label: "Portuguese" },
];

export default function Profile() {
  const { user, profile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const upsertProfile = useUpsertProfile({
    request: { headers: { 'x-user-id': user?.id || '' } }
  });
  
  const [username, setUsername] = useState(profile?.username || "");
  const [gender, setGender] = useState<ProfileInputGender | "">(profile?.gender as ProfileInputGender || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [language, setLanguage] = useState(profile?.language || "en");
  const [tagInput, setTagInput] = useState("");
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setGender(profile.gender as ProfileInputGender);
      setCountry(profile.country || "");
      setLanguage(profile.language || "en");
      setInterests(profile.interests || []);
    }
  }, [profile]);

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

  const handleSave = () => {
    if (!username.trim() || !gender || !country) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
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
    }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully!" });
        setLocation("/home");
      },
      onError: (err) => {
        toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-2xl mx-auto z-10 relative">
        <Button 
          variant="ghost" 
          className="mb-8 hover:bg-white/10" 
          onClick={() => setLocation("/home")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>

        <div className="glass-panel rounded-3xl p-8 relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your details to refine your matches.</p>
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
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="glass-input h-12 bg-black/40 border-white/10" data-testid="select-country">
                    <Globe2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Primary Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="glass-input h-12 bg-black/40 border-white/10" data-testid="select-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Interests</label>
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
                  placeholder="Type interests and press Enter..."
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/30 p-1"
                  data-testid="input-interests"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={upsertProfile.isPending}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              {upsertProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
