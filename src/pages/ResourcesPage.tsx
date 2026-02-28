import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { BookOpen, Heart, Brain, Phone, MessageCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EncouragementSheet from "@/components/EncouragementSheet";

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
];

const ADVOCACY_RESOURCES = [
  {
    title: "Advocating for Pain Treatment",
    description: "How to effectively communicate your pain to healthcare providers and push for the care you deserve.",
    emoji: "🗣️",
  },
  {
    title: "When Your Pain Is Dismissed",
    description: "What to do when a doctor doesn't take your pain seriously — your experience is valid.",
    emoji: "✊",
  },
  {
    title: "Pain Bias in Healthcare",
    description: "Understanding how racial and gender bias affects pain treatment, especially for Black and Indigenous patients.",
    emoji: "📊",
  },
  {
    title: "Finding Culturally Competent Care",
    description: "Resources to help you find providers who understand your identity and lived experience.",
    emoji: "🤝",
  },
  {
    title: "Your Rights as a Patient",
    description: "Know your rights when seeking pain treatment. You deserve to be heard and believed.",
    emoji: "⚖️",
  },
  {
    title: "Preparing for Doctor Visits",
    description: "Templates and scripts to help you communicate your symptoms clearly and get taken seriously.",
    emoji: "📋",
  },
];

const ResourcesPage = () => {
  const navigate = useNavigate();
  const [showAdvocacy, setShowAdvocacy] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
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
                      setShowAdvocacy(!showAdvocacy);
                    } else if (cat.id === "encouragement") {
                      setShowEncouragement(true);
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

          {/* Advocacy Resources (expanded from Communication) */}
          {showAdvocacy && (
            <div className="mt-4 space-y-3 animate-slide-up">
              <h3 className="text-sm font-bold text-muted-foreground">Communication & Advocacy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your pain is real. These resources are here to help you advocate for yourself and get the care you deserve.
              </p>
              {ADVOCACY_RESOURCES.map((res, i) => (
                <div
                  key={i}
                  className="rounded-2xl border bg-card p-4 transition-all hover:shadow-sm animate-slide-up"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{res.emoji}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">{res.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{res.description}</p>
                    </div>
                  </div>
                </div>
              ))}

              {suggestedForYou && (
                <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4">
                  <p className="text-xs leading-relaxed">
                    <span className="text-base mr-1">🐻</span>
                    <strong>Buddy noticed</strong> you've logged feeling dismissed or discriminated against recently.
                    These resources might be especially helpful right now. Remember: your pain is real, and you deserve to be heard. 💛
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ResourcesPage;
