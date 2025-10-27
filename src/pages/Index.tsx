import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";
import DashboardRouter from "@/components/DashboardRouter";
import { Loader2 } from "lucide-react";

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return isAuthenticated ? <DashboardRouter /> : <LoginPage />;
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
