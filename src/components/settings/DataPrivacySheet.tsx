import { useState } from "react";
import { Download, Loader2, Shield } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DataPrivacySheet = ({ open, onClose }: Props) => {
  const { session } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    if (!session) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("exportMyData", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wellbeing-buddy-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-lg">Data & Privacy</SheetTitle>
        </SheetHeader>

        {/* Data Export */}
        <section className="mb-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Your Data</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Download a copy of all your check-ins, reports, preferences, and encouragement notes as a JSON file.
          </p>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full gap-2"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download My Data
          </Button>
        </section>

        {/* Privacy Policy */}
        <section className="pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Privacy Policy</h3>
          </div>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed rounded-2xl border bg-card p-4">
            <div>
              <p className="font-semibold text-foreground mb-1">What We Collect</p>
              <p>
                We collect the information you provide during check-ins (pain levels, mood, symptoms, journal entries),
                your preferences and settings, and messages exchanged with your AI buddy. We do not collect browsing
                history, contacts, or any data outside the app.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">How It's Used</p>
              <p>
                Your data is used solely to personalize your experience — powering AI responses, generating reports,
                and tracking your wellbeing trends over time. We never use your data for advertising.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Storage & Security</p>
              <p>
                All data is encrypted in transit and at rest. Your information is scoped to your account — no other
                user can access it. Our infrastructure uses industry-standard security practices.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Third-Party Sharing</p>
              <p>
                We do not sell, rent, or share your personal data with third parties. AI processing is performed
                securely and your data is not used to train external models.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Data Deletion</p>
              <p>
                You can permanently delete your account and all associated data at any time from the Profile &
                Settings page. Once deleted, your data cannot be recovered.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Contact</p>
              <p>
                For privacy questions or concerns, email us at{" "}
                <a href="mailto:ashleydarling87@gmail.com" className="text-primary underline">
                  ashleydarling87@gmail.com
                </a>.
              </p>
            </div>
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
};

export default DataPrivacySheet;
