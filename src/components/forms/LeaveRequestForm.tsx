import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { demoLeaveTypes } from "@/data/demoData";

interface LeaveRequestFormProps {
  onSubmitSuccess?: () => void;
}

const LeaveRequestForm = ({ onSubmitSuccess }: LeaveRequestFormProps) => {
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    urgency: "normal"
  });

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leaveType || !formData.startDate || !formData.endDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const days = calculateDays();
    const selectedType = demoLeaveTypes.find(t => t.name === formData.leaveType);
    
    if (selectedType && days > selectedType.maxDays) {
      toast.error(`Le nombre de jours demandé (${days}) dépasse le maximum autorisé (${selectedType.maxDays} jours)`);
      return;
    }

    toast.success(`Demande de congé soumise avec succès ! (${days} jour${days > 1 ? 's' : ''})`);
    
    // Reset form
    setFormData({
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      urgency: "normal"
    });
    
    onSubmitSuccess?.();
  };

  const days = calculateDays();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Nouvelle Demande de Congé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Type de congé *</Label>
              <Select value={formData.leaveType} onValueChange={(value) => setFormData({...formData, leaveType: value})}>
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
              <Label htmlFor="urgency">Urgence</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData({...formData, urgency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Urgence médicale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>

          {days > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Durée calculée:</strong> {days} jour{days > 1 ? 's' : ''} de congé
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motif détaillé</Label>
            <Textarea
              id="reason"
              placeholder="Précisez le motif de votre demande (optionnel mais recommandé)..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex space-x-4">
            <Button type="submit" className="flex-1">
              Soumettre la Demande
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setFormData({
                leaveType: "",
                startDate: "",
                endDate: "",
                reason: "",
                urgency: "normal"
              })}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestForm;