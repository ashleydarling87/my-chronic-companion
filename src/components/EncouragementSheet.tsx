import { useState, useEffect } from "react";
import { X, Plus, Send, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Note {
  id: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  display_name: string | null;
  author_profile_pic: string | null;
}

const EncouragementSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchNotes();
      fetchUserInfo();
    }
  }, [open]);

  const fetchUserInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_preferences")
      .select("profile_picture_url")
      .eq("user_id", user.id)
      .maybeSingle();

    setUserProfilePic((data as any)?.profile_picture_url || null);

    // Try to get name from user metadata, fallback to email prefix
    const meta = user.user_metadata;
    const name = meta?.full_name || meta?.name || user.email?.split("@")[0] || "User";
    setUserDisplayName(name);
  };

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("encouragement_notes")
      .select("id, content, created_at, is_anonymous, display_name, author_profile_pic")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load notes:", error);
    } else {
      setNotes((data as Note[]) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newNote.trim() || !user) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("encouragement_notes")
      .insert({
        user_id: user.id,
        content: newNote.trim(),
        is_anonymous: isAnonymous,
        display_name: isAnonymous ? null : userDisplayName,
        author_profile_pic: isAnonymous ? null : userProfilePic,
      });

    if (error) {
      toast.error("Couldn't post your note");
    } else {
      toast.success("Your note was shared 💛");
      setNewNote("");
      setShowCompose(false);
      setIsAnonymous(false);
      fetchNotes();
    }
    setSubmitting(false);
  };

  if (!open) return null;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <h2 className="text-lg font-bold">💛 Encouragement Wall</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105"
            aria-label="Add a note"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Compose area */}
      {showCompose && (
        <div className="border-b bg-card px-4 py-3 space-y-2 animate-slide-up">
          <p className="text-xs text-muted-foreground">Share something kind 💛</p>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value.slice(0, 280))}
            placeholder="You've got this! 💪"
            maxLength={280}
            rows={3}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{newNote.length}/280</span>
              <span className="text-muted-foreground/30">|</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                  className="scale-75 origin-left"
                />
                <span className="text-[11px] text-muted-foreground font-medium">Anonymous</span>
              </label>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!newNote.trim() || submitting}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all disabled:opacity-40"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Share
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">💛</span>
            <p className="text-sm font-semibold">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to leave some encouragement!</p>
          </div>
        ) : (
          <div className="mx-auto max-w-lg space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border bg-card p-4 animate-slide-up"
              >
                {/* Author row */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Avatar className="h-8 w-8">
                    {!note.is_anonymous && note.author_profile_pic ? (
                      <AvatarImage src={note.author_profile_pic} alt={note.display_name || "User"} />
                    ) : null}
                    <AvatarFallback className={note.is_anonymous ? "bg-muted" : "bg-primary/10"}>
                      {note.is_anonymous ? (
                        <User size={14} className="text-muted-foreground" />
                      ) : (
                        <span className="text-xs font-semibold text-primary">
                          {(note.display_name || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      {note.is_anonymous ? "Anonymous" : (note.display_name || "User")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(note.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EncouragementSheet;
