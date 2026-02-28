import { useState, useEffect, useRef } from "react";

import { ArrowLeft, ChevronRight, LogOut, Camera, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BUDDY_AVATARS, getBuddyEmoji } from "../lib/data";
import PainPreferencesCard from "../components/PainPreferencesCard";
import CommunicationStyleCard from "../components/CommunicationStyleCard";
import CropSheet from "../components/CropSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfilePage = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { prefs, savePrefs } = useUserPreferences();
  const [name, setName] = useState("");
  const [buddyName, setBuddyName] = useState("Buddy");
  const [selectedAvatarId, setSelectedAvatarId] = useState("bear");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefs) {
      setName(prefs.display_name || "");
      setBuddyName(prefs.buddy_name);
      setSelectedAvatarId(prefs.buddy_avatar);
      setProfilePicUrl(prefs.profile_picture_url || null);
    }
  }, [prefs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so re-selecting same file works
    e.target.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    if (!user) return;
    setCropSrc(null);
    setUploading(true);

    const filePath = `${user.id}/profile.jpg`;

    await supabase.storage.from("profile-pictures").remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      toast.error("Failed to upload photo");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setProfilePicUrl(publicUrl);

    if (prefs?.id) {
      await supabase
        .from("user_preferences")
        .update({ profile_picture_url: publicUrl })
        .eq("id", prefs.id);
    }

    toast.success("Profile photo updated!");
    setUploading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Profile & Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-2 animate-slide-up">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative group"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 overflow-hidden border-2 border-primary/20">
                {uploading ? (
                  <Loader2 size={28} className="animate-spin text-muted-foreground" />
                ) : profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl">{getBuddyEmoji(selectedAvatarId)}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-110">
                <Camera size={14} />
              </div>
            </button>
            <p className="text-xs text-muted-foreground">Tap to change photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <CropSheet
            open={!!cropSrc}
            imageSrc={cropSrc || ""}
            onClose={() => setCropSrc(null)}
            onCropComplete={handleCroppedUpload}
          />

          {/* User Info */}
          <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Info</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => savePrefs({ display_name: name.trim() || null })}
                placeholder="Your name"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Age Range</label>
              <select
                value={prefs?.age_range || ""}
                onChange={(e) => savePrefs({ age_range: e.target.value } as any)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select age range</option>
                {["17–24", "25–30", "31–36", "37–42", "43–50", "51–60", "60+"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Buddy Customization */}
          <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Customize Your Buddy</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Buddy's Name</label>
              <input
                value={buddyName}
                onChange={(e) => setBuddyName(e.target.value)}
                onBlur={() => savePrefs({ buddy_name: buddyName.trim() || "Buddy" })}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Choose Avatar</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {BUDDY_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => {
                      setSelectedAvatarId(av.id);
                      savePrefs({ buddy_avatar: av.id });
                    }}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-3 transition-all ${
                      selectedAvatarId === av.id
                        ? "bg-primary/15 border-2 border-primary scale-105"
                        : "bg-secondary hover:bg-primary/10 border border-transparent"
                    }`}
                  >
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="text-xs font-medium">{av.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Pain & Communication Preferences */}
          <PainPreferencesCard />

          {/* Communication Style */}
          <CommunicationStyleCard />

          {/* Settings */}
          <section className="rounded-2xl border bg-card divide-y animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Settings</h2>
            {["Notifications", "Data Export", "Privacy", "Help & Support", "About"].map((item) => (
              <button key={item} className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-secondary/50 transition-colors">
                {item}
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </section>

          {/* Sign Out */}
          <section className="rounded-2xl border bg-card overflow-hidden">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
