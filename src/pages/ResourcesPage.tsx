import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { mockResources, type Resource } from "../lib/data";

const categoryLabels: Record<Resource["category"], string> = {
  "mental-health": "Mental Health",
  article: "Article",
  meditation: "Meditation",
  website: "Website",
};

const categoryColors: Record<Resource["category"], string> = {
  "mental-health": "bg-accent/15 text-accent",
  article: "bg-primary/15 text-primary",
  meditation: "bg-energy-high/15 text-energy-high",
  website: "bg-energy-mid/15 text-energy-mid",
};

const ResourceCard = ({ resource }: { resource: Resource }) => (
  <div className="rounded-2xl border bg-card p-4 animate-slide-up">
    <div className="flex items-start gap-3">
      <span className="text-2xl">{resource.emoji}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold">{resource.title}</h3>
        </div>
        <span className={`score-pill text-[10px] mb-2 ${categoryColors[resource.category]}`}>
          {categoryLabels[resource.category]}
        </span>
        <p className="text-sm text-muted-foreground mt-1.5">{resource.description}</p>
      </div>
    </div>
  </div>
);

const ResourcesPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Resources" subtitle="Curated just for you by Buddy 🐻" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg space-y-3">
          <div className="rounded-2xl bg-primary/10 p-4 animate-slide-up">
            <p className="text-sm leading-relaxed">
              <span className="text-xl mr-1">🐻</span>
              Based on what you've shared with me, I pulled together some resources that might help. 
              These update as we chat more! 💛
            </p>
          </div>

          {mockResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ResourcesPage;
