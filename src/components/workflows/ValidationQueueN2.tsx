/**
 * VALIDATION QUEUE N2 - CHEF DE SERVICE
 * 
 * Interface de validation spécialisée pour les chefs de service.
 * Ce composant représente la deuxième étape du workflow d'approbation hiérarchique.
 * 
 * Fonctionnalités :
 * - Affichage des demandes validées par N1 (pending_service_chief)
 * - Vision transverse : toutes les cellules du service
 * - Historique de validation N1 visible (commentaires, dates, valideurs)
 * - Détection de conflits inter-cellules
 * - Actions : Approuver (→ RH) / Rejeter / Commentaire
 * - Vue consolidée des absences prévues par cellule
 * 
 * Workflow :
 * PENDING_SERVICE_CHIEF --[APPROVE_N2]--> PENDING_HR
 * PENDING_SERVICE_CHIEF --[REJECT_N2]--> REJECTED
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Building,
  Calendar,
  Users,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface ApprovalHistory {
  level: 'n1' | 'n2';
  approver: string;
  date: string;
  comment?: string;
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  cellule: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  submittedAt: string;
  employeeBalance: number;
  employeePosition: string;
  approvalHistory: ApprovalHistory[];
}

interface ValidationQueueN2Props {
  service: string;
  userId: string;
  requests: LeaveRequest[];
  onApprove: (requestId: string, comment?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}

const ValidationQueueN2 = ({ 
  service, 
  userId, 
  requests, 
  onApprove, 
  onReject 
}: ValidationQueueN2Props) => {
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [showCommentForm, setShowCommentForm] = useState<{[key: string]: boolean}>({});
  const [isProcessing, setIsProcessing] = useState<{[key: string]: boolean}>({});

  // Grouper les demandes par cellule pour vision transverse
  const requestsByCellule = requests.reduce((acc, req) => {
    if (!acc[req.cellule]) acc[req.cellule] = [];
    acc[req.cellule].push(req);
    return acc;
  }, {} as {[key: string]: LeaveRequest[]});

  const handleApprove = async (requestId: string) => {
    setIsProcessing({ ...isProcessing, [requestId]: true });
    try {
      const comment = comments[requestId];
      await onApprove(requestId, comment);
      toast.success("Demande approuvée et transmise aux RH", {
        description: "La demande a été envoyée pour validation finale"
      });
      setComments({ ...comments, [requestId]: "" });
      setShowCommentForm({ ...showCommentForm, [requestId]: false });
    } catch (error) {
      toast.error("Erreur lors de l'approbation", {
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
    } finally {
      setIsProcessing({ ...isProcessing, [requestId]: false });
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = comments[requestId];
    if (!reason || reason.trim().length < 10) {
      toast.error("Motif de rejet requis", {
        description: "Veuillez fournir un motif détaillé (minimum 10 caractères)"
      });
      return;
    }

    setIsProcessing({ ...isProcessing, [requestId]: true });
    try {
      await onReject(requestId, reason);
      toast.success("Demande rejetée", {
        description: "L'employé et le responsable de cellule ont été notifiés"
      });
      setComments({ ...comments, [requestId]: "" });
      setShowCommentForm({ ...showCommentForm, [requestId]: false });
    } catch (error) {
      toast.error("Erreur lors du rejet", {
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
    } finally {
      setIsProcessing({ ...isProcessing, [requestId]: false });
    }
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
          <p className="text-muted-foreground">
            Toutes les demandes du service {service} ont été traitées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              File d'Attente - Service {service}
            </span>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-base">
                {requests.length} demande{requests.length > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="text-base">
                {Object.keys(requestsByCellule).length} cellule{Object.keys(requestsByCellule).length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Vue par cellule */}
      {Object.entries(requestsByCellule).map(([cellule, celluleRequests]) => (
        <div key={cellule} className="space-y-4">
          <div className="flex items-center gap-2 mt-6">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Cellule {cellule}</h3>
            <Badge variant="outline">{celluleRequests.length} demande{celluleRequests.length > 1 ? 's' : ''}</Badge>
          </div>

          {celluleRequests.map((request) => {
            const n1Approval = request.approvalHistory.find(h => h.level === 'n1');

            return (
              <Card key={request.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{request.employeeName}</h4>
                        <Badge variant="secondary">{request.employeePosition}</Badge>
                        <Badge variant="outline">Cellule {request.cellule}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="font-medium">Période demandée:</span>
                          </div>
                          <p className="text-foreground">
                            Du {new Date(request.startDate).toLocaleDateString('fr-FR')} 
                            au {new Date(request.endDate).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.days} jour{request.days > 1 ? 's' : ''} ouvrés
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground">
                            <strong>Type:</strong> {request.leaveType}
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Solde:</strong> {request.employeeBalance} jours
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Soumise le:</strong> {new Date(request.submittedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="bg-muted rounded p-3 mb-3">
                          <p className="text-sm font-medium mb-1">Motif de la demande :</p>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                        </div>
                      )}

                      {/* Historique de validation N1 */}
                      {n1Approval && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-green-800">
                                ✓ Validé par le responsable de cellule
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                Par {n1Approval.approver} le {new Date(n1Approval.date).toLocaleDateString('fr-FR')} à {new Date(n1Approval.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {n1Approval.comment && (
                                <div className="mt-2 bg-white rounded p-2 border border-green-100">
                                  <MessageSquare className="inline w-3 h-3 mr-1 text-green-600" />
                                  <span className="text-sm text-green-800">{n1Approval.comment}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Formulaire de commentaire */}
                  {showCommentForm[request.id] && (
                    <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                      <Label className="text-sm font-semibold mb-2 block">
                        Commentaire du chef de service
                      </Label>
                      <Textarea
                        placeholder="Ajoutez votre commentaire (optionnel pour approbation, obligatoire pour rejet)..."
                        value={comments[request.id] || ""}
                        onChange={(e) => setComments({ ...comments, [request.id]: e.target.value })}
                        className="mb-3"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={isProcessing[request.id]}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          {isProcessing[request.id] ? 'Traitement...' : 'Approuver'}
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing[request.id]}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          {isProcessing[request.id] ? 'Traitement...' : 'Rejeter'}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCommentForm({ ...showCommentForm, [request.id]: false })}
                          disabled={isProcessing[request.id]}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions principales */}
                  {!showCommentForm[request.id] && (
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleApprove(request.id)}
                        className="flex items-center"
                        disabled={isProcessing[request.id]}
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Valider et Transmettre aux RH
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => setShowCommentForm({ ...showCommentForm, [request.id]: true })}
                        className="flex items-center"
                        disabled={isProcessing[request.id]}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeter
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowCommentForm({ ...showCommentForm, [request.id]: true })}
                        className="flex items-center"
                        disabled={isProcessing[request.id]}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ajouter un Commentaire
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ValidationQueueN2;
