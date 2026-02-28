import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import ChatPage from "./pages/ChatPage";
import LogPage from "./pages/LogPage";
import WeeklyPage from "./pages/WeeklyPage";
import ResourcesPage from "./pages/ResourcesPage";
import ProfilePage from "./pages/ProfilePage";
import SummaryPage from "./pages/SummaryPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 size={32} className="animate-spin text-primary" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { onboardingComplete, loading: onboardingLoading } = useOnboardingStatus();

  if (authLoading || onboardingLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const OnboardingRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { onboardingComplete, loading: onboardingLoading } = useOnboardingStatus();

  if (authLoading || onboardingLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (onboardingComplete) return <Navigate to="/" replace />;

  return <OnboardingPage />;
};

const AuthRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return <AuthPage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute />} />
    <Route path="/onboarding" element={<OnboardingRoute />} />
    <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    <Route path="/log" element={<ProtectedRoute><LogPage /></ProtectedRoute>} />
    <Route path="/weekly" element={<ProtectedRoute><WeeklyPage /></ProtectedRoute>} />
    <Route path="/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
