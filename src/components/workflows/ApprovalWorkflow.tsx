import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  ArrowRight,
  User
} from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  urgency: string;
  status: string;
  submittedAt: string;
  cellManagerApproval?: {
    date: string;
    comment?: string;
    approver: string;
  };
  serviceChiefApproval?: {
    date: string;
    comment?: string;
    approver: string;
  };
}

interface ApprovalWorkflowProps {
  requests: LeaveRequest[];
  userRole: string;
  onApprove: (requestId: string, comment?: string) => void;
  onReject: (requestId: string, comment?: string) => void;
}

const ApprovalWorkflow = ({ requests, userRole, onApprove, onReject }: ApprovalWorkflowProps) => {
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [showCommentForm, setShowCommentForm] = useState<{[key: string]: boolean}>({});

  const getWorkflowSteps = () => {
    return [
      { role: 'employee', label: 'Employé', icon: User },
      { role: 'cell_manager', label: 'Chef de Cellule', icon: CheckCircle },
      { role: 'service_chief', label: 'Chef de Service', icon: CheckCircle },
      { role: 'hr', label: 'RH', icon: CheckCircle }
    ];
  };

  const getRequestStatus = (request: LeaveRequest) => {
    if (request.status === 'pending_cell_manager') return 1;
    if (request.status === 'pending_service_chief') return 2;
    if (request.status === 'pending_hr') return 3;
    if (request.status === 'approved') return 4;
    return 0;
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge className="bg-orange-500">Urgent</Badge>;
      case 'emergency':
        return <Badge className="bg-red-500">Urgence Médicale</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const handleApproveWithComment = (requestId: string) => {
    const comment = comments[requestId];
    onApprove(requestId, comment);
    setComments({...comments, [requestId]: ""});
    setShowCommentForm({...showCommentForm, [requestId]: false});
  };

  const handleRejectWithComment = (requestId: string) => {
    const comment = comments[requestId];
    if (!comment) {
      toast.error("Un commentaire est obligatoire pour le rejet");
      return;
    }
    onReject(requestId, comment);
    setComments({...comments, [requestId]: ""});
    setShowCommentForm({...showCommentForm, [requestId]: false});
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
          <p className="text-muted-foreground">
            Toutes les demandes ont été traitées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map(request => {
        const currentStatus = getRequestStatus(request);
        const steps = getWorkflowSteps();
        
        return (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold text-lg">{request.employeeName}</h4>
                    <Badge variant="secondary" className="ml-2">
                      {request.leaveType}
                    </Badge>
                    {getUrgencyBadge(request.urgency)}
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
            </CardHeader>
            
            <CardContent>
              {/* Workflow de validation */}
              <div className="mb-6">
                <h5 className="font-semibold mb-3">Processus de Validation</h5>
                <div className="flex items-center space-x-4">
                  {steps.map((step, index) => {
                    const isCompleted = currentStatus > index;
                    const isCurrent = currentStatus === index;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.role} className="flex items-center">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          isCompleted 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : isCurrent 
                            ? 'border-blue-500 text-blue-500' 
                            : 'border-gray-300 text-gray-300'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`ml-2 text-sm ${
                          isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </span>
                        {index < steps.length - 1 && (
                          <ArrowRight className="mx-3 w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historique des validations */}
              {(request.cellManagerApproval || request.serviceChiefApproval) && (
                <div className="mb-6">
                  <h5 className="font-semibold mb-3">Historique des Validations</h5>
                  <div className="space-y-2">
                    {request.cellManagerApproval && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">
                          <strong>✓ Validé par le responsable de cellule</strong> 
                          <span className="ml-2 text-green-600">
                            le {new Date(request.cellManagerApproval.date).toLocaleDateString('fr-FR')}
                          </span>
                        </p>
                        {request.cellManagerApproval.comment && (
                          <p className="text-sm text-green-700 mt-1">
                            <MessageSquare className="inline w-3 h-3 mr-1" />
                            {request.cellManagerApproval.comment}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {request.serviceChiefApproval && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">
                          <strong>✓ Validé par le chef de service</strong>
                          <span className="ml-2 text-green-600">
                            le {new Date(request.serviceChiefApproval.date).toLocaleDateString('fr-FR')}
                          </span>
                        </p>
                        {request.serviceChiefApproval.comment && (
                          <p className="text-sm text-green-700 mt-1">
                            <MessageSquare className="inline w-3 h-3 mr-1" />
                            {request.serviceChiefApproval.comment}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formulaire de commentaire */}
              {showCommentForm[request.id] && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-semibold">Commentaire (optionnel pour approbation, obligatoire pour rejet)</Label>
                  <Textarea
                    placeholder="Ajoutez un commentaire pour cette décision..."
                    value={comments[request.id] || ""}
                    onChange={(e) => setComments({...comments, [request.id]: e.target.value})}
                    className="mt-2 mb-3"
                  />
                  <div className="flex space-x-2">
                    <Button 
                      size="sm"
                      onClick={() => handleApproveWithComment(request.id)}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approuver
                    </Button>
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectWithComment(request.id)}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Rejeter
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCommentForm({...showCommentForm, [request.id]: false})}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!showCommentForm[request.id] && (
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => onApprove(request.id)}
                    className="flex items-center"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approuver
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => onReject(request.id)}
                    className="flex items-center"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeter
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowCommentForm({...showCommentForm, [request.id]: true})}
                    className="flex items-center"
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

export default ApprovalWorkflow;