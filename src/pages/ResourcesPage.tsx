import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { BookOpen, Heart, Brain, Phone, MessageCircle } from "lucide-react";

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
    description: "Craft messages",
  },
];

const ResourcesPage = () => {
  const navigate = useNavigate();

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
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/resources/${cat.id}`)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-transform active:scale-95 animate-slide-up`}
                >
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

      <BottomNav />
    </div>
  );
};

export default ResourcesPage;
