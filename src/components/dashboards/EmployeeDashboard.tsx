import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getLeaveRequestsByEmployee, demoLeaveTypes } from "@/data/demoData";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const userRequests = getLeaveRequestsByEmployee(user?.id || "");

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    toast.success("Demande de congé soumise avec succès !");
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

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

        {/* Formulaire de demande de congé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Nouvelle Demande de Congé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Type de congé *</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type de congé" />
                    </SelectTrigger>
                    <SelectContent>
                      {demoLeaveTypes.map(type => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name} (max {type.maxDays} jours)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motif (optionnel)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Précisez le motif de votre demande..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1">
                  Soumettre la Demande
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setLeaveType("");
                    setStartDate("");
                    setEndDate("");
                    setReason("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Historique des demandes */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Demandes</CardTitle>
          </CardHeader>
          <CardContent>
            {userRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune demande de congé trouvée
              </p>
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
      </div>
    </div>
  );
};

export default EmployeeDashboard;