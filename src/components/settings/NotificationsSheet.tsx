import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

type NotifKey = "dailyReminder" | "weeklyReport" | "encouragement" | "crisisUpdates";

const NOTIF_OPTIONS: { key: NotifKey; label: string; desc: string }[] = [
  { key: "dailyReminder", label: "Daily check-in reminder", desc: "A gentle nudge to log how you're feeling" },
  { key: "weeklyReport", label: "Weekly report ready", desc: "Get notified when your summary is available" },
  { key: "encouragement", label: "Encouragement notes", desc: "When someone leaves a note for the community" },
  { key: "crisisUpdates", label: "Crisis resource updates", desc: "Important updates to crisis support info" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const NotificationsSheet = ({ open, onClose }: Props) => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [toggles, setToggles] = useState<Record<NotifKey, boolean>>({
    dailyReminder: true,
    weeklyReport: true,
    encouragement: false,
    crisisUpdates: true,
  });

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, [open]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleToggle = (key: NotifKey, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-lg">Notifications</SheetTitle>
          <p className="text-sm text-muted-foreground">Choose what you'd like to be notified about.</p>
        </SheetHeader>

        {/* Permission banner */}
        {permission !== "granted" && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <BellOff size={20} className="mt-0.5 shrink-0 text-primary" />
            <div className="flex-1">
              {permission === "denied" ? (
                <>
                  <p className="text-sm font-semibold">Notifications are blocked</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You'll need to enable notifications in your browser or device settings to receive alerts.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">Enable notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Allow notifications so you never miss an important update.
                  </p>
                  <button
                    onClick={requestPermission}
                    className="mt-2 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Allow Notifications
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {permission === "granted" && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/5 p-3">
            <Bell size={18} className="text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Notifications enabled</p>
          </div>
        )}

        <div className="space-y-1 pb-4">
          {NOTIF_OPTIONS.map((opt) => (
            <label
              key={opt.key}
              className="flex items-center justify-between rounded-xl px-1 py-3 cursor-pointer"
            >
              <div className="pr-4">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <Switch
                checked={toggles[opt.key]}
                onCheckedChange={(v) => handleToggle(opt.key, v)}
              />
            </label>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsSheet;
