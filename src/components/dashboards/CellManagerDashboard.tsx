import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Users, Bell } from "lucide-react";
import { toast } from "sonner";
import { getPendingRequestsForCellManager, demoUsers } from "@/data/demoData";

const CellManagerDashboard = () => {
  const { user } = useAuth();
  
  const pendingRequests = getPendingRequestsForCellManager(user?.cellule || "");
  const cellEmployees = demoUsers.filter(u => u.cellule === user?.cellule && u.role === 'employee');

  const handleApprove = (requestId: string) => {
    toast.success("Demande approuvée avec succès !");
  };

  const handleReject = (requestId: string) => {
    toast.error("Demande rejetée");
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

        {/* Liste des demandes en attente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Demandes en Attente de Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
                <p className="text-muted-foreground">
                  Toutes les demandes de votre cellule ont été traitées.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(request => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-semibold text-lg">{request.employeeName}</h4>
                          <Badge variant="secondary" className="ml-2">
                            {request.leaveType}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p><strong>Période:</strong> Du {new Date(request.startDate).toLocaleDateString('fr-FR')} au {new Date(request.endDate).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Durée:</strong> {request.days} jour{request.days > 1 ? 's' : ''}</p>
                          </div>
                          <div>
                            <p><strong>Soumise le:</strong> {new Date(request.submittedAt).toLocaleDateString('fr-FR')}</p>
                            {request.reason && <p><strong>Motif:</strong> {request.reason}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleApprove(request.id)}
                        className="flex items-center"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approuver
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                        className="flex items-center"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des employés de la cellule */}
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
                <div key={employee.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">{employee.firstName} {employee.lastName}</h4>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm">Solde: {employee.leaveBalance} jours</span>
                    <Badge variant="outline">{employee.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CellManagerDashboard;