/**
 * EMPLOYEE DASHBOARD
 * 
 * Ce composant affiche le tableau de bord pour les employés.
 * Il permet aux employés de :
 * - Consulter leurs informations personnelles et solde de congés
 * - Soumettre de nouvelles demandes de congés
 * - Suivre l'état de leurs demandes en cours
 * - Recevoir des notifications
 * - Consulter leurs statistiques personnelles
 * 
 * Flux de données :
 * - Récupère les informations de l'utilisateur depuis AuthContext
 * - Charge l'historique des demandes de congés via getLeaveRequestsByEmployee()
 * - Affiche les statistiques en temps réel (solde, demandes en cours)
 * 
 * Sécurité :
 * - Seules les demandes de l'employé connecté sont visibles
 * - Le user_id est automatiquement associé aux nouvelles demandes
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, User, Bell, FileText, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getLeaveRequestsByEmployee } from "@/data/demoData";
import LeaveRequestForm from "@/components/forms/LeaveRequestForm";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DashboardReports from "@/components/reports/DashboardReports";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  // Charge toutes les demandes de congés de l'employé connecté
  const userRequests = getLeaveRequestsByEmployee(user?.id || "");

  /**
   * Callback exécuté après la soumission réussie d'une demande
   */
  const handleFormSuccess = () => {
    toast.info("Votre demande sera traitée dans les plus brefs délais");
  };

  /**
   * Retourne un badge coloré selon le statut de la demande
   * @param status - Le statut de la demande (pending_cell_manager, approved, rejected, etc.)
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_cell_manager':
        return <Badge variant="secondary">En attente - Chef de Cellule</Badge>;
      case 'pending_service_chief':
        return <Badge variant="secondary">En attente - Chef de Service</Badge>;
      case 'pending_hr':
        return <Badge variant="secondary">En attente - RH</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de Bord Employé
            </h1>
            <p className="text-muted-foreground">
              Bienvenue, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <User className="mr-2 h-4 w-4" />
            Mon Profil
          </Button>
        </div>

        {/* Informations personnelles et solde */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Informations Personnelles</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Nom:</strong> {user?.lastName}</p>
                <p><strong>Prénom:</strong> {user?.firstName}</p>
                <p><strong>Poste:</strong> {user?.position}</p>
                <p><strong>Service:</strong> {user?.service}</p>
                <p><strong>Cellule:</strong> {user?.cellule}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde des Congés</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{user?.leaveBalance} jours</div>
              <p className="text-xs text-muted-foreground">
                Congés disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes en Cours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {userRequests.filter(r => r.status.includes('pending')).length}
              </div>
              <p className="text-xs text-muted-foreground">
                En attente de validation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets principaux */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests">Mes Demandes</TabsTrigger>
            <TabsTrigger value="new">Nouvelle Demande</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="reports">Mes Statistiques</TabsTrigger>
          </TabsList>

          {/* Historique des demandes */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Historique des Demandes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune demande de congé</h3>
                    <p className="text-muted-foreground mb-4">
                      Vous n'avez pas encore soumis de demande de congé.
                    </p>
                    <Button onClick={() => {
                      const newTab = document.querySelector('[value="new"]') as HTMLElement;
                      newTab?.click();
                    }}>
                      Créer ma première demande
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRequests.map(request => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{request.leaveType}</h4>
                            <p className="text-sm text-muted-foreground">
                              Du {new Date(request.startDate).toLocaleDateString('fr-FR')} 
                              au {new Date(request.endDate).toLocaleDateString('fr-FR')} 
                              ({request.days} jour{request.days > 1 ? 's' : ''})
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Soumise le {new Date(request.submittedAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Motif:</strong> {request.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formulaire de nouvelle demande */}
          <TabsContent value="new">
            <LeaveRequestForm onSubmitSuccess={handleFormSuccess} />
          </TabsContent>

          {/* Centre de notifications */}
          <TabsContent value="notifications">
            <NotificationCenter userId={user?.id || ""} userRole="employee" />
          </TabsContent>

          {/* Statistiques personnelles */}
          <TabsContent value="reports">
            <DashboardReports userRole="employee" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDashboard;