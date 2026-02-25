import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { buddyAvatars } from "../lib/data";

const ProfilePage = () => {
  const [name, setName] = useState("Alex");
  const [dob, setDob] = useState("1995-06-15");
  const [buddyName, setBuddyName] = useState("Buddy");
  const [selectedAvatar, setSelectedAvatar] = useState("🐻");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold">Profile & Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 animate-slide-up">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
              {selectedAvatar}
            </div>
            <p className="text-sm text-muted-foreground">Your AI buddy</p>
          </div>

          {/* User Info */}
          <section className="rounded-2xl border bg-card p-4 space-y-4 animate-slide-up">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Info</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
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
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Choose Avatar</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {buddyAvatars.map((av) => (
                  <button
                    key={av}
                    onClick={() => setSelectedAvatar(av)}
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all ${
                      selectedAvatar === av
                        ? "bg-primary/20 ring-2 ring-primary scale-110"
                        : "bg-secondary hover:bg-primary/10"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 <strong>Personalize your buddy!</strong> Chat with {buddyName} for 5-10 minutes and they'll learn how you talk, 
                your humor, and your vibe. The more you chat, the more they sound like your real bestie.
              </p>
            </div>
          </section>

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
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
