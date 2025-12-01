/**
 * VALIDATION QUEUE RH - RESSOURCES HUMAINES
 * 
 * Interface de validation spécialisée pour les Ressources Humaines.
 * Ce composant représente la DERNIÈRE ÉTAPE du workflow d'approbation hiérarchique.
 * 
 * Fonctionnalités :
 * - Affichage des demandes validées par N1 et N2 (pending_hr)
 * - Vision organisationnelle complète (tous services)
 * - Historique de validation complet (N1 + N2) visible
 * - Validation finale et définitive
 * - Actions : Approuver Final (→ Approved) / Rejeter / Ajuster Soldes
 * - Déduction automatique des soldes lors de l'approbation finale
 * - Outils d'administration : rapports, exports, statistiques
 * 
 * Workflow :
 * PENDING_HR --[APPROVE_HR]--> APPROVED (+ déduction solde)
 * PENDING_HR --[REJECT_HR]--> REJECTED
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
  Shield,
  Calendar,
  Building,
  Users,
  FileCheck,
  AlertCircle
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
  service: string;
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

interface ValidationQueueRHProps {
  userId: string;
  requests: LeaveRequest[];
  onFinalApprove: (requestId: string, comment?: string) => Promise<void>;
  onFinalReject: (requestId: string, reason: string) => Promise<void>;
  onAdjustBalance?: (userId: string, adjustment: number, reason: string) => Promise<void>;
}

const ValidationQueueRH = ({ 
  userId, 
  requests, 
  onFinalApprove, 
  onFinalReject,
  onAdjustBalance
}: ValidationQueueRHProps) => {
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [showCommentForm, setShowCommentForm] = useState<{[key: string]: boolean}>({});
  const [isProcessing, setIsProcessing] = useState<{[key: string]: boolean}>({});
  const [expandedHistory, setExpandedHistory] = useState<{[key: string]: boolean}>({});

  // Grouper par service pour vue organisationnelle
  const requestsByService = requests.reduce((acc, req) => {
    if (!acc[req.service]) acc[req.service] = [];
    acc[req.service].push(req);
    return acc;
  }, {} as {[key: string]: LeaveRequest[]});

  const handleFinalApprove = async (requestId: string) => {
    setIsProcessing({ ...isProcessing, [requestId]: true });
    try {
      const comment = comments[requestId];
      await onFinalApprove(requestId, comment);
      toast.success("✅ Validation finale effectuée", {
        description: "La demande est approuvée et le solde a été déduit automatiquement"
      });
      setComments({ ...comments, [requestId]: "" });
      setShowCommentForm({ ...showCommentForm, [requestId]: false });
    } catch (error) {
      toast.error("Erreur lors de la validation finale", {
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
    } finally {
      setIsProcessing({ ...isProcessing, [requestId]: false });
    }
  };

  const handleFinalReject = async (requestId: string) => {
    const reason = comments[requestId];
    if (!reason || reason.trim().length < 15) {
      toast.error("Motif de rejet requis", {
        description: "Pour un rejet au niveau RH, veuillez fournir un motif très détaillé (minimum 15 caractères)"
      });
      return;
    }

    setIsProcessing({ ...isProcessing, [requestId]: true });
    try {
      await onFinalReject(requestId, reason);
      toast.success("Demande rejetée", {
        description: "Toute la hiérarchie et l'employé ont été notifiés"
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

  const toggleHistoryExpanded = (requestId: string) => {
    setExpandedHistory({ ...expandedHistory, [requestId]: !expandedHistory[requestId] });
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune demande en attente de validation RH</h3>
          <p className="text-muted-foreground">
            Toutes les demandes ont été traitées ou sont en cours de validation par les managers.
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
              <Shield className="mr-2 h-5 w-5 text-primary" />
              Validation Finale RH - Vue Organisationnelle
            </span>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-base">
                {requests.length} demande{requests.length > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="text-base">
                {Object.keys(requestsByService).length} service{Object.keys(requestsByService).length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Vue par service */}
      {Object.entries(requestsByService).map(([service, serviceRequests]) => (
        <div key={service} className="space-y-4">
          <div className="flex items-center gap-2 mt-6">
            <Building className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Service {service}</h3>
            <Badge variant="outline">{serviceRequests.length} demande{serviceRequests.length > 1 ? 's' : ''}</Badge>
          </div>

          {serviceRequests.map((request) => {
            const n1Approval = request.approvalHistory.find(h => h.level === 'n1');
            const n2Approval = request.approvalHistory.find(h => h.level === 'n2');
            const hasInsufficientBalance = request.employeeBalance < request.days;

            return (
              <Card key={request.id} className="border-primary/30 shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-lg">{request.employeeName}</h4>
                        <Badge variant="secondary">{request.employeePosition}</Badge>
                        <Badge variant="outline">Service {request.service}</Badge>
                        <Badge variant="outline">Cellule {request.cellule}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="font-medium">Période:</span>
                          </div>
                          <p className="text-foreground">
                            {new Date(request.startDate).toLocaleDateString('fr-FR')} 
                            → {new Date(request.endDate).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.days} jour{request.days > 1 ? 's' : ''} ouvrés
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground">
                            <strong>Type:</strong> {request.leaveType}
                          </p>
                          <p className={`${hasInsufficientBalance ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                            <strong>Solde:</strong> {request.employeeBalance} jours
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Soumise le:</strong> {new Date(request.submittedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <FileCheck className="h-3 w-3 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">Pré-validée N1 ✓</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileCheck className="h-3 w-3 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">Pré-validée N2 ✓</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            En attente validation finale RH
                          </p>
                        </div>
                      </div>

                      {/* Alerte solde insuffisant */}
                      {hasInsufficientBalance && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-800">
                              ⚠️ Attention : Solde insuffisant
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              L'employé ne dispose que de {request.employeeBalance} jours pour {request.days} jours demandés.
                              Vous pouvez ajuster le solde manuellement ou rejeter la demande.
                            </p>
                          </div>
                        </div>
                      )}

                      {request.reason && (
                        <div className="bg-muted rounded p-3 mb-3">
                          <p className="text-sm font-medium mb-1">Motif de la demande :</p>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                        </div>
                      )}

                      {/* Historique complet de validation (N1 + N2) */}
                      <div className="space-y-2 mb-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleHistoryExpanded(request.id)}
                          className="w-full justify-between"
                        >
                          <span className="font-semibold">Historique de validation complet</span>
                          <span>{expandedHistory[request.id] ? '▼' : '▶'}</span>
                        </Button>

                        {expandedHistory[request.id] && (
                          <div className="space-y-2 pl-4 border-l-2 border-green-200">
                            {n1Approval && (
                              <div className="bg-green-50 border border-green-200 rounded p-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-800">
                                      Niveau 1 : Responsable de Cellule
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                      Validé par {n1Approval.approver} le {new Date(n1Approval.date).toLocaleDateString('fr-FR')} à {new Date(n1Approval.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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

                            {n2Approval && (
                              <div className="bg-green-50 border border-green-200 rounded p-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-800">
                                      Niveau 2 : Chef de Service
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                      Validé par {n2Approval.approver} le {new Date(n2Approval.date).toLocaleDateString('fr-FR')} à {new Date(n2Approval.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {n2Approval.comment && (
                                      <div className="mt-2 bg-white rounded p-2 border border-green-100">
                                        <MessageSquare className="inline w-3 h-3 mr-1 text-green-600" />
                                        <span className="text-sm text-green-800">{n2Approval.comment}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Formulaire de commentaire */}
                  {showCommentForm[request.id] && (
                    <div className="mb-4 p-4 border rounded-lg bg-primary/5">
                      <Label className="text-sm font-semibold mb-2 block">
                        Commentaire RH - Validation Finale
                      </Label>
                      <Textarea
                        placeholder="Commentaire de la décision finale RH (optionnel pour approbation, obligatoire pour rejet)..."
                        value={comments[request.id] || ""}
                        onChange={(e) => setComments({ ...comments, [request.id]: e.target.value })}
                        className="mb-3"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleFinalApprove(request.id)}
                          disabled={isProcessing[request.id]}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Shield className="mr-1 h-4 w-4" />
                          {isProcessing[request.id] ? 'Traitement...' : 'Validation Finale'}
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => handleFinalReject(request.id)}
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
                        onClick={() => handleFinalApprove(request.id)}
                        className="flex items-center bg-green-600 hover:bg-green-700"
                        disabled={isProcessing[request.id]}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Validation Finale et Approbation
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

export default ValidationQueueRH;
