import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";
import DashboardRouter from "@/components/DashboardRouter";

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  
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
