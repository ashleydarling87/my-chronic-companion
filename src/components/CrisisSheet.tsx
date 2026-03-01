import { X, Phone, MessageSquare } from "lucide-react";

const CRISIS_LINES = [
  {
    name: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support for people in distress.",
    phone: "988",
    type: "call" as const,
  },
  {
    name: "988 Suicide & Crisis Lifeline (Text)",
    description: "Text-based support — available 24/7.",
    sms: "988",
    type: "text" as const,
  },
  {
    name: "Crisis Text Line",
    description: "Text HOME to 741741 for free crisis counseling.",
    sms: "741741",
    smsBody: "HOME",
    type: "text" as const,
  },
  {
    name: "SAMHSA National Helpline",
    description: "Free referral & information service for mental health and substance use.",
    phone: "18002374357",
    displayPhone: "1-800-237-4357",
    type: "call" as const,
  },
  {
    name: "National Domestic Violence Hotline",
    description: "Confidential support for domestic violence survivors.",
    phone: "18007997233",
    displayPhone: "1-800-799-7233",
    type: "call" as const,
  },
  {
    name: "Trevor Project (LGBTQ+ Youth)",
    description: "Crisis intervention for LGBTQ+ young people. Call or text START to 678-678.",
    phone: "18664887386",
    displayPhone: "1-866-488-7386",
    sms: "678678",
    smsBody: "START",
    type: "both" as const,
  },
];

const CrisisSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <h2 className="text-lg font-bold">🆘 Crisis Resources</h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl bg-destructive/10 p-4 mb-4">
            <p className="text-sm leading-relaxed">
              If you or someone you know is in immediate danger, please call <strong>911</strong>. These resources are free, confidential, and available 24/7.
            </p>
          </div>

          <div className="space-y-3">
            {CRISIS_LINES.map((line, i) => (
              <div key={i} className="rounded-2xl border bg-card p-4 animate-slide-up">
                <h3 className="text-sm font-bold">{line.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{line.description}</p>
                {line.type === "call" ? (
                  <a
                    href={`tel:${line.phone}`}
                    className="mt-3 flex items-center justify-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-xs font-semibold text-destructive-foreground transition-all active:scale-95"
                  >
                    <Phone size={14} />
                    Call Now{line.displayPhone ? ` · ${line.displayPhone}` : ` · ${line.phone}`}
                  </a>
                ) : (
                  <a
                    href={`sms:${line.sms}${line.smsBody ? `?body=${encodeURIComponent(line.smsBody)}` : ""}`}
                    className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all active:scale-95"
                  >
                    <MessageSquare size={14} />
                    Text Now · {line.sms}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisSheet;
