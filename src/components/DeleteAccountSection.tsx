import { useState } from "react";
import { Trash2, Download, Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DELETE_REASONS = [
  { id: "too-hard", label: "Too hard to use" },
  { id: "not-helpful", label: "Not helpful" },
  { id: "too-expensive", label: "Too expensive" },
  { id: "not-using", label: "Not using it enough" },
];

const DeleteAccountSection = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"reason" | "confirm">("reason");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleExportData = async () => {
    if (!session) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("exportMyData", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
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

  const handleDelete = async () => {
    if (!session || !selectedReason) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("deleteAccount", {
        body: { reason: selectedReason },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast.success("Your account has been deleted");
      navigate("/auth");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setStep("reason");
      setSelectedReason(null);
      setConfirmText("");
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-destructive/20 bg-card overflow-hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors"
        >
          <Trash2 size={16} /> Delete My Account
        </button>
      </section>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          {step === "reason" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-destructive" />
                  Delete Your Account
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  We're sorry to see you go. Could you tell us why you're leaving?
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2 py-2">
                {DELETE_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                      selectedReason === reason.id
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  variant="destructive"
                  disabled={!selectedReason}
                  onClick={() => setStep("confirm")}
                  className="w-full"
                >
                  Continue
                </Button>
                <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-destructive" />
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left space-y-3">
                  <span className="block font-semibold text-foreground">
                    This action is permanent and cannot be undone.
                  </span>
                  <span className="block">
                    Once your account is deleted, all your check-ins, reports,
                    preferences, and personal data will be permanently removed
                    from our systems and will not be recoverable.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="py-2">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={exporting}
                  className="w-full gap-2"
                >
                  {exporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Send Me My Data
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  Download a copy of all your data before deleting
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Type <span className="font-bold text-destructive">DELETE</span> to confirm
                </label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-destructive/30"
                  autoComplete="off"
                />
              </div>

              <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting || confirmText !== "DELETE"}
                  className="w-full gap-2"
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Permanently Delete My Account
                </Button>
                <AlertDialogCancel className="w-full mt-0">Go Back</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteAccountSection;
