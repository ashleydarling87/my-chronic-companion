import { useState, useEffect } from "react";
import { X, Plus, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

const EncouragementSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNotes();
    }
  }, [open]);

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("encouragement_notes")
      .select("id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load notes:", error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newNote.trim() || !user) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("encouragement_notes")
      .insert({ user_id: user.id, content: newNote.trim() });

    if (error) {
      toast.error("Couldn't post your note");
    } else {
      toast.success("Your note was shared 💛");
      setNewNote("");
      setShowCompose(false);
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
          <p className="text-xs text-muted-foreground">Share something kind — it's anonymous to others 💛</p>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value.slice(0, 280))}
            placeholder="You've got this! 💪"
            maxLength={280}
            rows={3}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{newNote.length}/280</span>
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
                <p className="text-sm leading-relaxed">{note.content}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{timeAgo(note.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EncouragementSheet;
