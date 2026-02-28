import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const DISMISSED_KEY = "onboarding_popup_dismissed";

const OnboardingCompleteDialog = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show only once — right after onboarding redirect
    const justOnboarded = sessionStorage.getItem("just_onboarded");
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (justOnboarded && !dismissed) {
      setOpen(true);
      sessionStorage.removeItem("just_onboarded");
    }
  }, []);

  const handleSettings = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setOpen(false);
    navigate("/profile");
  };

  const handleLater = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleLater()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg">You're all set! 🎉</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Head to your profile settings to update additional preferences — like communication style, identity context, and more — to further tailor your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleSettings} className="w-full gap-2">
            <Settings size={16} />
            Settings
          </Button>
          <Button variant="ghost" onClick={handleLater} className="w-full text-muted-foreground">
            I'll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingCompleteDialog;
