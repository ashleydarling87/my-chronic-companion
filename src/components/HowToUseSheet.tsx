import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const tips = [
  {
    emoji: "💬",
    title: "Chat with Buddy",
    text: "Tell Buddy how you're feeling each day. It'll ask follow-up questions and automatically log your check-in.",
  },
  {
    emoji: "📋",
    title: "View Your Log",
    text: "Every check-in is saved to your Log tab. Tap any entry to see details or edit it.",
  },
  {
    emoji: "📊",
    title: "Weekly & Doctor Reports",
    text: "The Reports tab generates summaries you can share with your healthcare provider.",
  },
  {
    emoji: "⚙️",
    title: "Personalize Your Experience",
    text: "Go to Profile & Settings to set your communication style, pain scale preference, identity context, and more.",
  },
  {
    emoji: "💛",
    title: "Encouragement Wall",
    text: "Leave an anonymous note of encouragement for the community — or read one when you need a boost.",
  },
  {
    emoji: "🆘",
    title: "Crisis Resources",
    text: "If you're in crisis, tap the Crisis tile for immediate hotlines and support.",
  },
];

const HowToUseSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
    <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
      <SheetHeader className="text-left mb-4">
        <SheetTitle className="text-lg">How to Use This App</SheetTitle>
        <p className="text-sm text-muted-foreground">Quick tips to help you get the most out of your experience.</p>
      </SheetHeader>
      <div className="space-y-3 pb-4">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border bg-card p-3">
            <span className="text-xl mt-0.5">{tip.emoji}</span>
            <div>
              <h4 className="text-sm font-bold">{tip.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
    </SheetContent>
  </Sheet>
);

export default HowToUseSheet;
