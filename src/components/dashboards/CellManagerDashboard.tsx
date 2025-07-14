import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Users, Bell, FileText } from "lucide-react";
import { toast } from "sonner";
import { getPendingRequestsForCellManager, demoUsers, approveLeaveRequest, rejectLeaveRequest } from "@/data/demoData";
import ApprovalWorkflow from "@/components/workflows/ApprovalWorkflow";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DashboardReports from "@/components/reports/DashboardReports";

const CellManagerDashboard = () => {
  const { user } = useAuth();
  
  const pendingRequests = getPendingRequestsForCellManager(user?.cellule || "");
  const cellEmployees = demoUsers.filter(u => u.cellule === user?.cellule && u.role === 'employee');

  const handleApprove = (requestId: string, comment?: string) => {
    if (!user) return;
    
    approveLeaveRequest(requestId, `${user.firstName} ${user.lastName}`, 'cell_manager', comment);
    toast.success("Demande approuvée et transmise automatiquement au chef de service !");
    
    // Forcer le re-render en réactualisant la page
    window.location.reload();
  };

  const handleReject = (requestId: string, comment?: string) => {
    if (!user) return;
    
    rejectLeaveRequest(requestId, `${user.firstName} ${user.lastName}`, 'cell_manager', comment);
    toast.error("Demande rejetée");
    
    // Forcer le re-render en réactualisant la page
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de Bord - Responsable de Cellule
            </h1>
            <p className="text-muted-foreground">
              Cellule {user?.cellule} - {user?.firstName} {user?.lastName}
            </p>
          </div>
          <Button variant="outline">
            <Bell className="mr-2 h-4 w-4" />
            Notifications ({pendingRequests.length})
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes en Attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Nécessitent votre validation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employés de la Cellule</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{cellEmployees.length}</div>
              <p className="text-xs text-muted-foreground">
                Sous votre responsabilité
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cellule</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{user?.cellule}</div>
              <p className="text-xs text-muted-foreground">
                Service {user?.service}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets principaux */}
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="approvals">Validations</TabsTrigger>
            <TabsTrigger value="team">Mon Équipe</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          {/* Workflow de validation */}
          <TabsContent value="approvals">
            <ApprovalWorkflow 
              requests={pendingRequests} 
              userRole="cell_manager"
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>

          {/* Gestion de l'équipe */}
          <TabsContent value="team">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Employés de la Cellule {user?.cellule}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cellEmployees.map(employee => (
                    <div key={employee.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold">{employee.firstName} {employee.lastName}</h4>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Solde congé:</span>
                          <Badge variant="outline">{employee.leaveBalance} jours</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Statut:</span>
                          <Badge className="bg-green-500">Actif</Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="mr-1 h-3 w-3" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Centre de notifications */}
          <TabsContent value="notifications">
            <NotificationCenter userId={user?.id || ""} userRole="cell_manager" />
          </TabsContent>

          {/* Rapports et analyses */}
          <TabsContent value="reports">
            <DashboardReports userRole="cell_manager" cellule={user?.cellule} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CellManagerDashboard;