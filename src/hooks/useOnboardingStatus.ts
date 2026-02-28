import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOnboardingStatus() {
  const { user } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle();

      setOnboardingComplete(data?.onboarding_complete === true);
      setLoading(false);
    };

    check();
  }, [user]);

  return { onboardingComplete, loading };
}
