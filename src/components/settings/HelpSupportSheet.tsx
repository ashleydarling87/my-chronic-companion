import { Mail, LifeBuoy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQ_ITEMS = [
  {
    q: "My check-in didn't save",
    a: "Make sure you're connected to the internet and try again. If the problem persists, try signing out and back in. Your buddy will re-prompt you if a check-in was lost.",
  },
  {
    q: "How do I change my buddy's name or avatar?",
    a: "Go to Profile & Settings → Customize Your Buddy. You can change your buddy's name and pick a new avatar at any time.",
  },
  {
    q: "How do I export my data?",
    a: "Go to Profile & Settings → Data & Privacy and tap \"Download My Data\". A JSON file with all your entries, reports, and preferences will be downloaded.",
  },
  {
    q: "Can I undo a deleted account?",
    a: "No — account deletion is permanent and irreversible. We recommend downloading your data first before deleting.",
  },
  {
    q: "How do I generate a report for my doctor?",
    a: "Navigate to the Reports tab and select the date range you'd like to include. You can then share or save the generated summary.",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const HelpSupportSheet = ({ open, onClose }: Props) => (
  <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
    <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
      <SheetHeader className="text-left mb-4">
        <SheetTitle className="text-lg flex items-center gap-2">
          <LifeBuoy size={20} /> Help & Support
        </SheetTitle>
        <p className="text-sm text-muted-foreground">Find answers or reach out to us.</p>
      </SheetHeader>

      {/* FAQ */}
      <section className="mb-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Having trouble?
        </h3>
        <Accordion type="single" collapsible className="rounded-2xl border bg-card overflow-hidden">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-b-0 px-4">
              <AccordionTrigger className="text-sm text-left py-3">{item.q}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Feature Ideas */}
      <section className="pb-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Have an idea?
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          We'd love to hear your suggestions for new features or improvements. Your feedback helps us build a better experience for everyone.
        </p>
        <Button asChild variant="outline" className="w-full gap-2">
          <a href="mailto:ashley@cozyzebra.com?subject=CozyZebra%20Feedback">
            <Mail size={16} />
            Email Us
          </a>
        </Button>
      </section>
    </SheetContent>
  </Sheet>
);

export default HelpSupportSheet;
