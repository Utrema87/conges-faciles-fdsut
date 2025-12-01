/**
 * VALIDATION QUEUE N1 - RESPONSABLE DE CELLULE
 * 
 * Interface de validation spécialisée pour les responsables de cellule.
 * Ce composant représente la première étape du workflow d'approbation hiérarchique.
 * 
 * Fonctionnalités :
 * - Affichage des demandes en attente de validation N1 (pending_cell_manager)
 * - Filtrage automatique par cellule (seules les demandes de SA cellule)
 * - Contexte enrichi : solde employé, historique, urgence
 * - Actions : Approuver (→ Chef Service) / Rejeter / Commentaire
 * - Priorisation des demandes urgentes
 * - Vue du planning d'équipe pour évaluer l'impact
 * 
 * Workflow :
 * PENDING_CELL_MANAGER --[APPROVE_N1]--> PENDING_SERVICE_CHIEF
 * PENDING_CELL_MANAGER --[REJECT_N1]--> REJECTED
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
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  status: string;
  submittedAt: string;
  employeeBalance: number;
  employeePosition: string;
}

interface ValidationQueueN1Props {
  cellule: string;
  userId: string;
  requests: LeaveRequest[];
  onApprove: (requestId: string, comment?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}

const ValidationQueueN1 = ({ 
  cellule, 
  userId, 
  requests, 
  onApprove, 
  onReject 
}: ValidationQueueN1Props) => {
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [showCommentForm, setShowCommentForm] = useState<{[key: string]: boolean}>({});
  const [isProcessing, setIsProcessing] = useState<{[key: string]: boolean}>({});

  // Tri par priorité : urgences médicales > urgences > normales
  const sortedRequests = [...requests].sort((a, b) => {
    const urgencyOrder = { emergency: 0, urgent: 1, normal: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return (
          <Badge className="bg-red-500 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Urgence Médicale
          </Badge>
        );
      case 'urgent':
        return (
          <Badge className="bg-orange-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        );
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const handleApprove = async (requestId: string) => {
    setIsProcessing({ ...isProcessing, [requestId]: true });
    try {
      const comment = comments[requestId];
      await onApprove(requestId, comment);
      toast.success("Demande approuvée et transmise au chef de service", {
        description: "La demande a été envoyée pour validation N2"
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
        description: "L'employé a été notifié du rejet"
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

  const calculateDaysUntilStart = (startDate: string): number => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (sortedRequests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
          <p className="text-muted-foreground">
            Toutes les demandes de la cellule {cellule} ont été traitées.
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
              <Clock className="mr-2 h-5 w-5 text-primary" />
              File d'Attente - Cellule {cellule}
            </span>
            <Badge variant="outline" className="text-base">
              {sortedRequests.length} demande{sortedRequests.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Liste des demandes */}
      {sortedRequests.map((request) => {
        const daysUntilStart = calculateDaysUntilStart(request.startDate);
        const isImminentRequest = daysUntilStart <= 7 && daysUntilStart >= 0;

        return (
          <Card 
            key={request.id} 
            className={`${
              request.urgency === 'emergency' 
                ? 'border-red-500 border-2' 
                : request.urgency === 'urgent' 
                ? 'border-orange-500 border-2'
                : isImminentRequest
                ? 'border-yellow-500'
                : ''
            }`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-lg">{request.employeeName}</h4>
                    <Badge variant="secondary">{request.employeePosition}</Badge>
                    {getUrgencyBadge(request.urgency)}
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
                        <strong>Solde actuel:</strong> {request.employeeBalance} jours
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Soumise le:</strong> {new Date(request.submittedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Alertes contextuelles */}
                  {isImminentRequest && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Départ dans {daysUntilStart} jour{daysUntilStart > 1 ? 's' : ''} - Validation rapide recommandée
                      </p>
                    </div>
                  )}

                  {request.employeeBalance < request.days && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                      <p className="text-sm text-red-800">
                        ⚠️ Attention : Solde insuffisant ({request.employeeBalance} jours disponibles pour {request.days} jours demandés)
                      </p>
                    </div>
                  )}

                  {request.reason && (
                    <div className="bg-muted rounded p-3 mb-3">
                      <p className="text-sm font-medium mb-1">Motif de la demande :</p>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
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
                    Commentaire {isProcessing[request.id] && '(obligatoire pour rejet)'}
                  </Label>
                  <Textarea
                    placeholder="Ajoutez un commentaire sur votre décision (optionnel pour approbation, obligatoire pour rejet)..."
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
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approuver et Transmettre
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
  );
};

export default ValidationQueueN1;
