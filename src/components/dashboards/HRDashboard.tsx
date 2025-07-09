import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Settings, 
  BarChart3,
  Download,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { getPendingRequestsForHR, demoUsers, demoLeaveTypes } from "@/data/demoData";

const HRDashboard = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState("");
  const [balanceUpdate, setBalanceUpdate] = useState("");
  
  const pendingRequests = getPendingRequestsForHR();
  const totalEmployees = demoUsers.filter(u => u.role === 'employee').length;

  const handleFinalApproval = (requestId: string) => {
    toast.success("Demande approuvée définitivement et solde mis à jour !");
  };

  const handleFinalReject = (requestId: string) => {
    toast.error("Demande rejetée définitivement");
  };

  const handleUpdateBalance = () => {
    if (!selectedUser || !balanceUpdate) {
      toast.error("Veuillez sélectionner un utilisateur et saisir un solde");
      return;
    }
    toast.success(`Solde de congé mis à jour pour ${selectedUser}`);
    setSelectedUser("");
    setBalanceUpdate("");
  };

  const generateReport = () => {
    toast.success("Rapport généré et téléchargement en cours...");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de Bord - Ressources Humaines
            </h1>
            <p className="text-muted-foreground">
              {user?.firstName} {user?.lastName} - Service RH
            </p>
          </div>
          <Button onClick={generateReport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter les Données
          </Button>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validation Finale</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Demandes à traiter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Dans l'organisation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde Moyen</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Math.round(demoUsers.reduce((acc, u) => acc + u.leaveBalance, 0) / demoUsers.length)} jours
              </div>
              <p className="text-xs text-muted-foreground">
                Par employé
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Types de Congés</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{demoLeaveTypes.length}</div>
              <p className="text-xs text-muted-foreground">
                Configurés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets principaux */}
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="approvals">Validations Finales</TabsTrigger>
            <TabsTrigger value="balances">Gestion des Soldes</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          {/* Validations finales */}
          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Demandes Validées par les Chefs de Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
                    <p className="text-muted-foreground">
                      Toutes les demandes ont été traitées.
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

                            {/* Historique des validations */}
                            <div className="space-y-2 mb-3">
                              {request.cellManagerApproval && (
                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                  <p className="text-sm text-green-800">
                                    ✓ Validé par le responsable de cellule le {new Date(request.cellManagerApproval.date).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                              {request.serviceChiefApproval && (
                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                  <p className="text-sm text-green-800">
                                    ✓ Validé par le chef de service le {new Date(request.serviceChiefApproval.date).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleFinalApproval(request.id)}
                            className="flex items-center"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Validation Finale
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleFinalReject(request.id)}
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
          </TabsContent>

          {/* Gestion des soldes */}
          <TabsContent value="balances">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mise à Jour des Soldes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sélectionner un employé</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Choisir un employé...</option>
                      {demoUsers.filter(u => u.role === 'employee').map(user => (
                        <option key={user.id} value={user.firstName + ' ' + user.lastName}>
                          {user.firstName} {user.lastName} - {user.position}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nouveau solde (jours)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 25"
                      value={balanceUpdate}
                      onChange={(e) => setBalanceUpdate(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={handleUpdateBalance} className="w-full">
                    Mettre à Jour le Solde
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Soldes Actuels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {demoUsers.filter(u => u.role === 'employee').map(employee => (
                      <div key={employee.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-semibold">{employee.firstName} {employee.lastName}</p>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                        <Badge variant="outline">
                          {employee.leaveBalance} jours
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Configuration des Types de Congés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoLeaveTypes.map(type => (
                    <div key={type.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{type.name}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge>Max: {type.maxDays} jours</Badge>
                        <Button variant="outline" size="sm">Modifier</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    + Ajouter un Nouveau Type de Congé
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rapports */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Rapports Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" onClick={generateReport}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Rapport Mensuel des Congés
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={generateReport}>
                    <FileText className="mr-2 h-4 w-4" />
                    Statistiques par Service
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={generateReport}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Planning des Absences
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={generateReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Complet (Excel)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiques Rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Demandes ce mois</span>
                      <Badge>12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taux d'approbation</span>
                      <Badge className="bg-green-500">95%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Congés en cours</span>
                      <Badge variant="secondary">3</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Solde moyen restant</span>
                      <Badge variant="outline">
                        {Math.round(demoUsers.reduce((acc, u) => acc + u.leaveBalance, 0) / demoUsers.length)} jours
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HRDashboard;