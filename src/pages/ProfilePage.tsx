import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ChevronRight, LogOut, Camera, Loader2, Sun, Moon, Monitor, Bell, ShieldCheck, LifeBuoy, Info, Check, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { BUDDY_AVATARS, getBuddyEmoji } from "../lib/data";
import PainPreferencesCard from "../components/PainPreferencesCard";
import CommunicationStyleCard from "../components/CommunicationStyleCard";
import SymptomsCard from "../components/SymptomsCard";
import DeleteAccountSection from "../components/DeleteAccountSection";
import CropSheet from "../components/CropSheet";
import NotificationsSheet from "../components/settings/NotificationsSheet";
import DataPrivacySheet from "../components/settings/DataPrivacySheet";
import HelpSupportSheet from "../components/settings/HelpSupportSheet";
import AboutSheet from "../components/settings/AboutSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { UserPreferences, CommunicationStyle } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SettingsSheet = "notifications" | "data-privacy" | "help" | "about" | null;

const ProfilePage = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { prefs, savePrefs } = useUserPreferences();
  const { theme, setTheme } = useTheme();

  // Local draft state
  const [name, setName] = useState("");
  const [buddyName, setBuddyName] = useState("Buddy");
  const [selectedAvatarId, setSelectedAvatarId] = useState("bear");
  const [ageRange, setAgeRange] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [careRecipientName, setCareRecipientName] = useState("");
  const [careRecipientAgeRange, setCareRecipientAgeRange] = useState("");
  const [activeSheet, setActiveSheet] = useState<SettingsSheet>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Child component draft state
  const [painPref, setPainPref] = useState<UserPreferences["pain_preference"]>("numeric");
  const [misNote, setMisNote] = useState("");
  const [identityTags, setIdentityTags] = useState<string[]>([]);
  const [mySymptoms, setMySymptoms] = useState<string[]>([]);
  const [commStyle, setCommStyle] = useState<CommunicationStyle>({});

  // Save animation
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Unsaved changes dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Sync from prefs on load
  useEffect(() => {
    if (prefs) {
      setName(prefs.display_name || "");
      setBuddyName(prefs.buddy_name);
      setSelectedAvatarId(prefs.buddy_avatar);
      setAgeRange(prefs.age_range || "");
      setProfilePicUrl(prefs.profile_picture_url || null);
      setCareRecipientName(prefs.care_recipient_name || "");
      setCareRecipientAgeRange(prefs.care_recipient_age_range || "");
      setPainPref(prefs.pain_preference);
      setMisNote(prefs.pain_misunderstanding_note);
      setIdentityTags(prefs.identity_tags);
      setMySymptoms(prefs.my_symptoms);
      setCommStyle(prefs.communication_style);
    }
  }, [prefs]);

  // Dirty detection
  const isDirty = prefs ? (
    name !== (prefs.display_name || "") ||
    buddyName !== prefs.buddy_name ||
    selectedAvatarId !== prefs.buddy_avatar ||
    ageRange !== (prefs.age_range || "") ||
    careRecipientName !== (prefs.care_recipient_name || "") ||
    careRecipientAgeRange !== (prefs.care_recipient_age_range || "") ||
    painPref !== prefs.pain_preference ||
    misNote !== prefs.pain_misunderstanding_note ||
    JSON.stringify(identityTags) !== JSON.stringify(prefs.identity_tags) ||
    JSON.stringify(mySymptoms) !== JSON.stringify(prefs.my_symptoms) ||
    JSON.stringify(commStyle) !== JSON.stringify(prefs.communication_style)
  ) : false;

  const handleSaveAll = useCallback(async () => {
    if (!prefs || saving) return;
    setSaving(true);

    await savePrefs({
      display_name: name.trim() || null,
      buddy_name: buddyName.trim() || "Buddy",
      buddy_avatar: selectedAvatarId,
      age_range: ageRange,
      care_recipient_name: careRecipientName.trim() || null,
      care_recipient_age_range: careRecipientAgeRange || null,
      pain_preference: painPref,
      pain_misunderstanding_note: misNote,
      identity_tags: identityTags,
      my_symptoms: mySymptoms,
      communication_style: commStyle,
    });

    setSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [prefs, saving, name, buddyName, selectedAvatarId, ageRange, careRecipientName, careRecipientAgeRange, painPref, misNote, identityTags, mySymptoms, commStyle, savePrefs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
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
    if (uploadError) { toast.error("Failed to upload photo"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setProfilePicUrl(publicUrl);
    if (prefs?.id) {
      await supabase.from("user_preferences").update({ profile_picture_url: publicUrl }).eq("id", prefs.id);
    }
    toast.success("Profile photo updated!");
    setUploading(false);
  };

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Profile & Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-2 animate-slide-up">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="relative group">
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
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          </div>

          <CropSheet open={!!cropSrc} imageSrc={cropSrc || ""} onClose={() => setCropSrc(null)} onCropComplete={handleCroppedUpload} />

          {/* User Info */}
          <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Info</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Age Range</label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select age range</option>
                {["17–24", "25–30", "31–36", "37–42", "43–50", "51–60", "60+"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Care Recipient Info */}
          {prefs?.usage_mode === "caretaker" && (
            <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Person You Care For</h2>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Their Name</label>
                <input
                  value={careRecipientName}
                  onChange={(e) => setCareRecipientName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Their Age Range</label>
                <select
                  value={careRecipientAgeRange}
                  onChange={(e) => setCareRecipientAgeRange(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select age range</option>
                  {["0–4", "5–9", "10–13", "14–17", "17–24", "25–30", "31–36", "37–42", "43–50", "51–60", "60+"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">This helps your buddy ask about them by name.</p>
            </section>
          )}

          {/* Buddy Customization */}
          <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Customize Your Buddy</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Buddy's Name</label>
              <input
                value={buddyName}
                onChange={(e) => setBuddyName(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Choose Avatar</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {BUDDY_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatarId(av.id)}
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
          <PainPreferencesCard
            painPref={painPref}
            onPainPrefChange={setPainPref}
            misNote={misNote}
            onMisNoteChange={setMisNote}
            identityTags={identityTags}
            onIdentityTagsChange={setIdentityTags}
          />

          {/* Symptoms */}
          <SymptomsCard
            symptoms={mySymptoms}
            onSymptomsChange={setMySymptoms}
          />

          {/* Communication Style */}
          <CommunicationStyleCard
            style={commStyle}
            onStyleChange={setCommStyle}
          />

          {/* Appearance */}
          <section className="rounded-2xl border bg-card p-4 space-y-3 animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Appearance</h2>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all ${
                    theme === value
                      ? "bg-primary/15 border-2 border-primary"
                      : "bg-secondary hover:bg-primary/10 border border-transparent"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Settings */}
          <section className="rounded-2xl border bg-card divide-y animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Settings</h2>
            {([
              { key: "notifications" as const, label: "Notifications", icon: Bell },
              { key: "data-privacy" as const, label: "Data & Privacy", icon: ShieldCheck },
              { key: "help" as const, label: "Help & Support", icon: LifeBuoy },
              { key: "about" as const, label: "About", icon: Info },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSheet(key)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-secondary/50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} className="text-muted-foreground" />
                  {label}
                </span>
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

          <DeleteAccountSection />
        </div>
      </main>

      {/* Sticky Save Button */}
      {(isDirty || showSaved) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent animate-fade-in">
          <div className="mx-auto max-w-lg">
            <button
              onClick={handleSaveAll}
              disabled={saving || showSaved}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all duration-300 shadow-lg ${
                showSaved
                  ? "bg-green-600 text-white scale-[1.02]"
                  : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
              }`}
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : showSaved ? (
                <>
                  <Check size={18} className="animate-scale-in" />
                  <span className="animate-fade-in">Preferences Saved!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Settings Sheets */}
      <NotificationsSheet open={activeSheet === "notifications"} onClose={() => setActiveSheet(null)} />
      <DataPrivacySheet open={activeSheet === "data-privacy"} onClose={() => setActiveSheet(null)} />
      <HelpSupportSheet open={activeSheet === "help"} onClose={() => setActiveSheet(null)} />
      <AboutSheet
        open={activeSheet === "about"}
        onClose={() => setActiveSheet(null)}
        onOpenPrivacy={() => setActiveSheet("data-privacy")}
      />
    </div>
  );
};

export default ProfilePage;
