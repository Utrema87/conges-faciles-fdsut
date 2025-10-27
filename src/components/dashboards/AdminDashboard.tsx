import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  Eye,
  UserPlus,
  Edit,
  Trash2,
  Activity,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { adminService, UserProfile } from "@/services/adminService";
import { UserRole } from "@/types";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "" as UserRole | "",
    department: "",
    position: "",
    cellule: "",
    service: ""
  });
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cellManagers, setCellManagers] = useState<UserProfile[]>([]);
  const [serviceChiefs, setServiceChiefs] = useState<UserProfile[]>([]);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0
  });
  const [roleDistribution, setRoleDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, stats, rolesDist, managers, chiefs] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getStatistics(),
        adminService.getRoleDistribution(),
        adminService.getUsersByRole('cell_manager'),
        adminService.getUsersByRole('service_chief')
      ]);

      setUsers(allUsers);
      setStatistics(stats);
      setRoleDistribution(rolesDist);
      setCellManagers(managers);
      setServiceChiefs(chiefs);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email || 
        !newUserForm.password || !newUserForm.role) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (newUserForm.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setSubmitting(true);
    try {
      const result = await adminService.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        firstName: newUserForm.firstName,
        lastName: newUserForm.lastName,
        role: newUserForm.role as UserRole,
        department: newUserForm.department,
        position: newUserForm.position,
        cellule: newUserForm.cellule,
        service: newUserForm.service
      });

      if (result.success) {
        toast.success(`Utilisateur ${newUserForm.firstName} ${newUserForm.lastName} créé avec succès !`);
        setNewUserForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "",
          department: "",
          position: "",
          cellule: "",
          service: ""
        });
        // Recharger les données
        loadData();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erreur lors de la création: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ?`)) {
      return;
    }

    try {
      const result = await adminService.deleteUser(userId);
      if (result.success) {
        toast.success(`Utilisateur ${userName} supprimé avec succès`);
        loadData();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const handleEditUser = (userId: string, userName: string) => {
    toast.info(`Modification de ${userName} (fonctionnalité en développement)`);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'employee': { label: 'Employé', color: 'bg-blue-500' },
      'cell_manager': { label: 'Chef Cellule', color: 'bg-green-500' },
      'service_chief': { label: 'Chef Service', color: 'bg-purple-500' },
      'hr': { label: 'RH', color: 'bg-orange-500' },
      'admin': { label: 'Administrateur', color: 'bg-red-500' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-500' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getUserRole = (user: UserProfile): string => {
    return user.roles?.[0]?.role || 'employee';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de Bord - Administrateur
            </h1>
            <p className="text-muted-foreground">
              {user?.firstName} {user?.lastName} - Administration Système
            </p>
          </div>
          <Button variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Activité Système
          </Button>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{statistics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Comptes actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes Totales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{statistics.totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                Depuis le début
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Traitement</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{statistics.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Demandes en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Traitement</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.totalRequests > 0 
                  ? Math.round(((statistics.totalRequests - statistics.pendingRequests) / statistics.totalRequests) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Demandes traitées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets administrateur */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
            <TabsTrigger value="roles">Gestion des Rôles</TabsTrigger>
            <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
          </TabsList>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Création d'utilisateur */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Créer un Utilisateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Prénom *</Label>
                      <Input
                        placeholder="Amadou"
                        value={newUserForm.firstName}
                        onChange={(e) => setNewUserForm({...newUserForm, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        placeholder="Diallo"
                        value={newUserForm.lastName}
                        onChange={(e) => setNewUserForm({...newUserForm, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="amadou.diallo@fdsut.com"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mot de passe *</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Rôle *</Label>
                    <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm({...newUserForm, role: value as UserRole | ""})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employé</SelectItem>
                        <SelectItem value="cell_manager">Responsable de Cellule</SelectItem>
                        <SelectItem value="service_chief">Chef de Service</SelectItem>
                        <SelectItem value="hr">RH</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Département</Label>
                    <Input
                      placeholder="Informatique"
                      value={newUserForm.department}
                      onChange={(e) => setNewUserForm({...newUserForm, department: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Poste</Label>
                    <Input
                      placeholder="Développeur Senior"
                      value={newUserForm.position}
                      onChange={(e) => setNewUserForm({...newUserForm, position: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Input
                      placeholder="IT"
                      value={newUserForm.service}
                      onChange={(e) => setNewUserForm({...newUserForm, service: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cellule</Label>
                    <Input
                      placeholder="Développement"
                      value={newUserForm.cellule}
                      onChange={(e) => setNewUserForm({...newUserForm, cellule: e.target.value})}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateUser} 
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      'Créer l\'Utilisateur'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Liste des utilisateurs */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Liste des Utilisateurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {users.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Aucun utilisateur trouvé
                        </p>
                      ) : (
                        users.map(userProfile => (
                          <div key={userProfile.id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h4 className="font-semibold">{userProfile.first_name} {userProfile.last_name}</h4>
                                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                                  <p className="text-sm text-muted-foreground">{userProfile.position || 'N/A'} - {userProfile.department || 'N/A'}</p>
                                </div>
                                {getRoleBadge(getUserRole(userProfile))}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(userProfile.id, `${userProfile.first_name} ${userProfile.last_name}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(userProfile.id, `${userProfile.first_name} ${userProfile.last_name}`)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Gestion des rôles */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Répartition des Rôles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { role: 'employee', label: 'Employés', icon: Users },
                    { role: 'cell_manager', label: 'Responsables de Cellule', icon: Shield },
                    { role: 'service_chief', label: 'Chefs de Service', icon: Shield },
                    { role: 'hr', label: 'Ressources Humaines', icon: Settings },
                    { role: 'admin', label: 'Administrateurs', icon: Shield }
                  ].map(({ role, label, icon: Icon }) => {
                    const count = roleDistribution[role] || 0;
                    return (
                      <Card key={role}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{label}</CardTitle>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">{count}</div>
                          <p className="text-xs text-muted-foreground">
                            utilisateur{count > 1 ? 's' : ''}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vue d'ensemble */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Aperçu Global du Système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Demandes ce mois</span>
                      <Badge>{statistics.totalRequests}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Utilisateurs actifs</span>
                      <Badge className="bg-green-500">{statistics.totalUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Départements</span>
                      <Badge variant="secondary">
                        {[...new Set(users.map(u => u.department).filter(Boolean))].length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité Récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Nouvelle demande de Amadou Diallo</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Validation par Fatou Ndiaye</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Mise à jour solde par RH</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Création utilisateur Moussa Touré</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Système */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Configuration Système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Paramètres Généraux</h4>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Configuration des notifications
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      Gestion des permissions
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="mr-2 h-4 w-4" />
                      Journaux d'activité
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Maintenance</h4>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Sauvegarde des données
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Nettoyage automatique
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="mr-2 h-4 w-4" />
                      État du système
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;