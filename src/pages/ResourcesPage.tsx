import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { BookOpen, Heart, Brain, Phone, MessageCircle, Star, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EncouragementSheet from "@/components/EncouragementSheet";
import CrisisSheet from "@/components/CrisisSheet";
import HowToUseSheet from "@/components/HowToUseSheet";

const categories = [
  {
    id: "articles",
    label: "Articles",
    emoji: "📖",
    icon: BookOpen,
    color: "bg-primary/12 text-primary",
    description: "Curated reads",
  },
  {
    id: "encouragement",
    label: "Encouragement",
    emoji: "💛",
    icon: Heart,
    color: "bg-accent/12 text-accent",
    description: "Community love",
  },
  {
    id: "mindfulness",
    label: "Mindfulness",
    emoji: "🧘",
    icon: Brain,
    color: "bg-[hsl(var(--energy-mid))]/12 text-[hsl(var(--energy-mid))]",
    description: "Meditations & calm",
  },
  {
    id: "crisis",
    label: "Crisis",
    emoji: "🆘",
    icon: Phone,
    color: "bg-destructive/12 text-destructive",
    description: "Immediate help",
  },
  {
    id: "communication",
    label: "Communication",
    emoji: "💬",
    icon: MessageCircle,
    color: "bg-ring/12 text-ring",
    description: "Advocate for yourself",
  },
  {
    id: "how-to-use",
    label: "How to Use",
    emoji: "❓",
    icon: HelpCircle,
    color: "bg-secondary text-foreground",
    description: "Get the most out of this app",
  },
];


const ResourcesPage = () => {
  const navigate = useNavigate();
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [suggestedForYou, setSuggestedForYou] = useState(false);

  // Check if user has logged discrimination/dismissal recently
  useEffect(() => {
    checkForSuggestions();
  }, []);

  const checkForSuggestions = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("entries")
      .select("id")
      .or("felt_dismissed_by_provider.eq.true,experienced_discrimination.eq.true")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(3);

    if (!error && data && data.length >= 2) {
      setSuggestedForYou(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Resources" subtitle="Curated just for you by Buddy 🐻" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl bg-primary/10 p-4 mb-4 animate-slide-up">
            <p className="text-sm leading-relaxed">
              <span className="text-xl mr-1">🐻</span>
              Explore resources I've gathered based on our chats. Tap a category to dive in! 💛
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isCommunication = cat.id === "communication";
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isCommunication) {
                      navigate("/resources/communication");
                    } else if (cat.id === "encouragement") {
                      setShowEncouragement(true);
                    } else if (cat.id === "crisis") {
                      setShowCrisis(true);
                    } else if (cat.id === "how-to-use") {
                      setShowHowToUse(true);
                    } else if (cat.id === "mindfulness") {
                      navigate("/resources/mindfulness");
                    } else {
                      navigate(`/resources/${cat.id}`);
                    }
                  }}
                  className="relative flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-transform active:scale-95 animate-slide-up"
                >
                  {isCommunication && suggestedForYou && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                      <Star size={8} /> For you
                    </span>
                  )}
                  <div className={`rounded-xl p-2.5 ${cat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{cat.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{cat.description}</span>
                </button>
              );
            })}
          </div>

        </div>
      </main>

      <EncouragementSheet open={showEncouragement} onClose={() => setShowEncouragement(false)} />
      <CrisisSheet open={showCrisis} onClose={() => setShowCrisis(false)} />
      <HowToUseSheet open={showHowToUse} onClose={() => setShowHowToUse(false)} />
      <BottomNav />
    </div>
  );
};

export default ResourcesPage;
