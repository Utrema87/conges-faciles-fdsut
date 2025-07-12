import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Building, Bell, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getPendingRequestsForServiceChief, demoUsers } from "@/data/demoData";

const ServiceChiefDashboard = () => {
  const { user, profile } = useAuth();
  
  const pendingRequests = getPendingRequestsForServiceChief(profile?.department || "");
  const serviceEmployees = demoUsers.filter(u => u.service === profile?.department);

  const handleApprove = (requestId: string) => {
    toast.success("Demande approuvée et transmise aux RH !");
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
              Tableau de Bord - Chef de Service
            </h1>
            <p className="text-muted-foreground">
              Service {profile?.department} - {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <Button variant="outline">
            <Bell className="mr-2 h-4 w-4" />
            Notifications ({pendingRequests.length})
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes en Attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Validation requise
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employés du Service</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{serviceEmployees.length}</div>
              <p className="text-xs text-muted-foreground">
                Tous rôles confondus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responsables de Cellule</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {serviceEmployees.filter(u => u.role === 'cell_manager').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sous votre autorité
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'Approbation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">92%</div>
              <p className="text-xs text-muted-foreground">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demandes validées par les responsables de cellule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Demandes Validées par les Responsables de Cellule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
                <p className="text-muted-foreground">
                  Toutes les demandes ont été traitées ou aucune nouvelle demande validée.
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
                          <Badge variant="outline" className="ml-2">
                            Validé par cellule
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div>
                            <p><strong>Période:</strong> Du {new Date(request.startDate).toLocaleDateString('fr-FR')} au {new Date(request.endDate).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Durée:</strong> {request.days} jour{request.days > 1 ? 's' : ''}</p>
                          </div>
                          <div>
                            <p><strong>Soumise le:</strong> {new Date(request.submittedAt).toLocaleDateString('fr-FR')}</p>
                            {request.reason && <p><strong>Motif:</strong> {request.reason}</p>}
                          </div>
                        </div>

                        {request.cellManagerApproval && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                            <p className="text-sm text-green-800">
                              <strong>Validé par le responsable de cellule</strong> le {new Date(request.cellManagerApproval.date).toLocaleDateString('fr-FR')}
                            </p>
                            {request.cellManagerApproval.comment && (
                              <p className="text-sm text-green-700 mt-1">
                                Commentaire: {request.cellManagerApproval.comment}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleApprove(request.id)}
                        className="flex items-center"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Valider et Transmettre aux RH
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

        {/* Vue d'ensemble du service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Équipe du Service {profile?.department}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Responsables de cellule */}
              <div>
                <h4 className="font-semibold mb-3">Responsables de Cellule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceEmployees.filter(emp => emp.role === 'cell_manager').map(manager => (
                    <div key={manager.id} className="border rounded-lg p-4">
                      <h5 className="font-semibold">{manager.firstName} {manager.lastName}</h5>
                      <p className="text-sm text-muted-foreground">{manager.position}</p>
                      <p className="text-sm text-muted-foreground">Cellule: {manager.cellule}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm">Solde: {manager.leaveBalance} jours</span>
                        <Badge className="bg-blue-500">Chef Cellule</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employés */}
              <div>
                <h4 className="font-semibold mb-3">Employés</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {serviceEmployees.filter(emp => emp.role === 'employee').map(employee => (
                    <div key={employee.id} className="border rounded-lg p-4">
                      <h5 className="font-semibold">{employee.firstName} {employee.lastName}</h5>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <p className="text-sm text-muted-foreground">Cellule: {employee.cellule}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm">Solde: {employee.leaveBalance} jours</span>
                        <Badge variant="outline">Employé</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceChiefDashboard;