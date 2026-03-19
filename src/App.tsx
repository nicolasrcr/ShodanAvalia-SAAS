import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Evaluations from "./pages/Evaluations";
import NewEvaluation from "./pages/NewEvaluation";
import EvaluationDetail from "./pages/EvaluationDetail";
import History from "./pages/History";
import Programs from "./pages/Programs";
import Validations from "./pages/Validations";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
}

function RoleProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'admin' | 'moderator' }) {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  
  if (loading || roleLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  
  const hasAccess = requiredRole === 'moderator'
    ? (role === 'admin' || role === 'moderator')
    : role === requiredRole;
  
  if (!hasAccess) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/candidates" element={<RoleProtectedRoute requiredRole="moderator"><Candidates /></RoleProtectedRoute>} />
      <Route path="/evaluations" element={<ProtectedRoute><Evaluations /></ProtectedRoute>} />
      <Route path="/evaluations/:id" element={<ProtectedRoute><EvaluationDetail /></ProtectedRoute>} />
      <Route path="/new-evaluation" element={<RoleProtectedRoute requiredRole="moderator"><NewEvaluation /></RoleProtectedRoute>} />
      <Route path="/history" element={<RoleProtectedRoute requiredRole="moderator"><History /></RoleProtectedRoute>} />
      <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
      <Route path="/validations" element={<RoleProtectedRoute requiredRole="admin"><Validations /></RoleProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
