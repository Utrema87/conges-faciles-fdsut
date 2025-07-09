import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import EmployeeDashboard from "./dashboards/EmployeeDashboard";
import CellManagerDashboard from "./dashboards/CellManagerDashboard";
import ServiceChiefDashboard from "./dashboards/ServiceChiefDashboard";
import HRDashboard from "./dashboards/HRDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

const DashboardRouter = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bouton de déconnexion fixe */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>

      {/* Rendu du dashboard selon le rôle */}
      {user.role === 'employee' && <EmployeeDashboard />}
      {user.role === 'cell_manager' && <CellManagerDashboard />}
      {user.role === 'service_chief' && <ServiceChiefDashboard />}
      {user.role === 'hr' && <HRDashboard />}
      {user.role === 'admin' && <AdminDashboard />}
    </div>
  );
};

export default DashboardRouter;