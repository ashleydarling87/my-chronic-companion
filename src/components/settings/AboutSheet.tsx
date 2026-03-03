import { Heart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getBuddyEmoji } from "@/lib/data";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenPrivacy?: () => void;
}

const AboutSheet = ({ open, onClose, onOpenPrivacy }: Props) => {
  const { prefs } = useUserPreferences();
  const emoji = getBuddyEmoji(prefs?.buddy_avatar || "bear");

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left mb-2">
          <SheetTitle className="text-lg">About</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center py-4 gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
            <span className="text-4xl">{emoji}</span>
          </div>
          <h2 className="text-xl font-bold">CozyZebra</h2>
          <span className="text-xs text-muted-foreground">Version 1.0.0</span>
        </div>

        <p className="text-sm text-center text-muted-foreground leading-relaxed px-2 mb-6">
          Your cozy companion for tracking and understanding your wellbeing journey — one check-in at a time.
        </p>

        <div className="rounded-2xl border bg-card p-4 space-y-3 mb-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Our Mission</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            CozyZebra was created to give everyone a cozy, safe space to track how they're feeling — 
            physically and emotionally. Whether you're managing chronic pain, supporting a loved one, or simply 
            checking in with yourself, we're here to listen without judgment.
          </p>
        </div>

        <div className="flex flex-col gap-2 pb-4">
          {onOpenPrivacy && (
            <button
              onClick={() => {
                onClose();
                setTimeout(() => onOpenPrivacy(), 300);
              }}
              className="text-sm text-primary font-medium hover:underline"
            >
              Privacy Policy
            </button>
          )}
          <a
            href="mailto:ashley@cozyzebra.com?subject=CozyZebra%20Inquiry"
            className="text-sm text-primary font-medium hover:underline"
          >
            Contact Us
          </a>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pb-4">
          Made with <Heart size={12} className="text-red-500 fill-red-500" /> to keep you cozy
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AboutSheet;
