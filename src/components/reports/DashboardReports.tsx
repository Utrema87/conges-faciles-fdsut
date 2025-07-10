import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  FileText,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { demoUsers, demoLeaveRequests } from "@/data/demoData";

interface DashboardReportsProps {
  userRole: string;
  service?: string;
  cellule?: string;
}

const DashboardReports = ({ userRole, service, cellule }: DashboardReportsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Calculer les statistiques
  const calculateStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filteredUsers = demoUsers;
    let filteredRequests = demoLeaveRequests;

    // Filtrer selon le rôle
    if (userRole === 'cell_manager' && cellule) {
      filteredUsers = demoUsers.filter(u => u.cellule === cellule);
      filteredRequests = demoLeaveRequests.filter(r => {
        const user = demoUsers.find(u => u.firstName + ' ' + u.lastName === r.employeeName);
        return user?.cellule === cellule;
      });
    } else if (userRole === 'service_chief' && service) {
      filteredUsers = demoUsers.filter(u => u.service === service);
      filteredRequests = demoLeaveRequests.filter(r => {
        const user = demoUsers.find(u => u.firstName + ' ' + u.lastName === r.employeeName);
        return user?.service === service;
      });
    }

    const thisMonthRequests = filteredRequests.filter(r => {
      const requestDate = new Date(r.submittedAt);
      return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
    });

    const lastMonthRequests = filteredRequests.filter(r => {
      const requestDate = new Date(r.submittedAt);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return requestDate.getMonth() === lastMonth && requestDate.getFullYear() === lastMonthYear;
    });

    const approvedRequests = filteredRequests.filter(r => r.status === 'approved');
    const pendingRequests = filteredRequests.filter(r => r.status.includes('pending'));
    const rejectedRequests = filteredRequests.filter(r => r.status === 'rejected');

    return {
      totalUsers: filteredUsers.length,
      totalRequests: filteredRequests.length,
      thisMonthRequests: thisMonthRequests.length,
      lastMonthRequests: lastMonthRequests.length,
      approvedRequests: approvedRequests.length,
      pendingRequests: pendingRequests.length,
      rejectedRequests: rejectedRequests.length,
      averageLeaveBalance: Math.round(filteredUsers.reduce((acc, u) => acc + u.leaveBalance, 0) / filteredUsers.length),
      approvalRate: Math.round((approvedRequests.length / (approvedRequests.length + rejectedRequests.length)) * 100),
      trend: thisMonthRequests.length > lastMonthRequests.length ? 'up' : 'down',
      trendPercentage: lastMonthRequests.length > 0 
        ? Math.abs(Math.round(((thisMonthRequests.length - lastMonthRequests.length) / lastMonthRequests.length) * 100))
        : 0
    };
  };

  const stats = calculateStats();

  const generateReport = (type: string) => {
    toast.success(`Rapport ${type} généré et téléchargement en cours...`);
  };

  const exportData = (format: string) => {
    toast.success(`Export en format ${format} en cours...`);
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes ce Mois</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.thisMonthRequests}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {stats.trendPercentage}% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Approbation</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedRequests} approuvées / {stats.rejectedRequests} rejetées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Demandes à traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Moyen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averageLeaveBalance}</div>
            <p className="text-xs text-muted-foreground">
              Jours de congé restants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rapports détaillés */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Répartition des Statuts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Approuvées</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>{stats.approvedRequests}</span>
                      <Badge className="bg-green-500">
                        {Math.round((stats.approvedRequests / stats.totalRequests) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>En attente</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>{stats.pendingRequests}</span>
                      <Badge className="bg-orange-500">
                        {Math.round((stats.pendingRequests / stats.totalRequests) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rejetées</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>{stats.rejectedRequests}</span>
                      <Badge className="bg-red-500">
                        {Math.round((stats.rejectedRequests / stats.totalRequests) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques Clés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Temps de traitement moyen</span>
                    <Badge variant="outline">2.3 jours</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Satisfaction employés</span>
                    <Badge className="bg-green-500">4.2/5</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Types de congés populaires</span>
                    <Badge variant="secondary">Congé annuel</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pic de demandes</span>
                    <Badge variant="outline">Juillet-Août</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendances Mensuelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'].map((month, index) => (
                    <div key={month} className="flex justify-between items-center">
                      <span className="text-sm">{month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 h-2 bg-gray-200 rounded">
                          <div 
                            className="h-2 bg-blue-500 rounded" 
                            style={{ width: `${Math.random() * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm w-8">{Math.floor(Math.random() * 20) + 5}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analyses Prédictives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-semibold text-blue-800">Prévision Juillet</h4>
                    <p className="text-sm text-blue-700">
                      +35% de demandes attendues par rapport à juin
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <h4 className="font-semibold text-orange-800">Alerte Capacité</h4>
                    <p className="text-sm text-orange-700">
                      Service IT risque d'être en sous-effectif en août
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <h4 className="font-semibold text-green-800">Optimisation</h4>
                    <p className="text-sm text-green-700">
                      Délai de traitement amélioré de 15% ce trimestre
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Exports et Rapports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Rapports Standards</h4>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => generateReport('mensuel')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Rapport Mensuel
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => generateReport('annuel')}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Rapport Annuel
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => generateReport('par service')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Rapport par Service
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => generateReport('de conformité')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Rapport de Conformité
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Exports de Données</h4>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => exportData('Excel')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel (.xlsx)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => exportData('CSV')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => exportData('PDF')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => exportData('JSON')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON (API)
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-semibold mb-2">Planification des Rapports</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Configurez l'envoi automatique de rapports par email
                </p>
                <Button variant="outline" size="sm">
                  Configurer les Rapports Automatiques
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardReports;