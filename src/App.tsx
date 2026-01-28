import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import ActivityTracker from "./pages/ActivityTracker";
import ZonesPage from "./pages/ZonesPage";
import AICoach from "./pages/AICoach";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import { useAppStore } from "./store/appStore";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={
            <ProtectedRoute><OnboardingPage /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute><MapView /></ProtectedRoute>
          } />
          <Route path="/activity" element={
            <ProtectedRoute><ActivityTracker /></ProtectedRoute>
          } />
          <Route path="/zones" element={
            <ProtectedRoute><ZonesPage /></ProtectedRoute>
          } />
          <Route path="/coach" element={
            <ProtectedRoute><AICoach /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
