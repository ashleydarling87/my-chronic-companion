import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";

const TOPICS = ["All", "Pain Management", "Sleep", "Mental Health", "Mindfulness", "Nutrition", "Exercise", "Advocacy"];

interface Article {
  title: string;
  summary: string;
  source: string;
  topic: string;
  url: string;
  domain: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "Mayo Clinic": "bg-primary/15 text-primary",
  "NIH": "bg-accent/15 text-accent-foreground",
  "Cleveland Clinic": "bg-ring/15 text-ring",
  "Healthline": "bg-[hsl(var(--energy-mid))]/15 text-[hsl(var(--energy-mid))]",
  "WebMD": "bg-secondary text-secondary-foreground",
  "NAMI": "bg-destructive/15 text-destructive",
  "Psychology Today": "bg-primary/15 text-primary",
  "Headspace": "bg-accent/15 text-accent-foreground",
};

const ArticlesPage = () => {
  const navigate = useNavigate();
  const { prefs } = useUserPreferences();
  const [selectedTopic, setSelectedTopic] = useState("All");

  const { data: articles, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["articles", selectedTopic, prefs?.intake_condition],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("search-articles", {
        body: {
          condition: prefs?.intake_condition || "chronic pain",
          symptoms: prefs?.my_symptoms || [],
          topic: selectedTopic,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        throw new Error(data.error);
      }
      return data.articles as Article[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!prefs,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/resources")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Articles</h1>
            <p className="text-xs text-muted-foreground">Curated from trusted sources 📖</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto max-w-lg">
          {/* Buddy intro */}
          <div className="rounded-2xl bg-primary/10 p-4 mb-4 animate-slide-up">
            <p className="text-sm leading-relaxed">
              <span className="text-xl mr-1">🐻</span>
              Here are some articles I found based on your health profile. Tap any to read more on the source site!
            </p>
          </div>

          {/* Topic chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTopic === topic
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <div className="flex justify-end mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border bg-card p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                <span className="text-xl block mb-2">😔</span>
                Couldn't load articles right now. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Articles list */}
          {articles && !isLoading && (
            <div className="space-y-3 animate-slide-up">
              {articles.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border bg-card p-4 transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold leading-snug flex-1">{article.title}</h3>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{article.summary}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className={`text-[10px] font-semibold ${SOURCE_COLORS[article.source] || "bg-muted text-muted-foreground"}`}>
                      {article.source}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground">
                      {article.topic}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ArticlesPage;
