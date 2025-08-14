import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boat } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";

interface BoatModalProps {
  isOpen: boolean;
  onClose: () => void;
  boat: Boat | null;
  onSave: (boatData: Omit<Boat, 'id'>) => void;
}

const boatTypes = [
  "Ausflugsschiff",
  "Kanalboot", 
  "Wassertaxi",
  "Sportboot",
  "Segelboot",
  "Motorboot"
];

export function BoatModal({ isOpen, onClose, boat, onSave }: BoatModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    capacity: 1,
    type: "",
    description: "",
    available: true
  });

  const isEditMode = !!boat;

  useEffect(() => {
    if (boat) {
      setFormData({
        name: boat.name,
        capacity: boat.capacity,
        type: boat.type,
        description: boat.description || "",
        available: boat.available
      });
    } else {
      setFormData({
        name: "",
        capacity: 1,
        type: "",
        description: "",
        available: true
      });
    }
  }, [boat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || formData.capacity < 1) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
    toast({
      title: isEditMode ? "Boot aktualisiert" : "Boot hinzugefügt",
      description: `Das Boot "${formData.name}" wurde erfolgreich ${isEditMode ? "aktualisiert" : "hinzugefügt"}.`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditMode ? "Boot bearbeiten" : "Neues Boot hinzufügen"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Bootname *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="z.B. MS Nordhorn"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Bootstyp *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Bootstyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                {boatTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="capacity">Kapazität (Personen) *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optionale Beschreibung des Boots..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) => setFormData({...formData, available: checked})}
            />
            <Label htmlFor="available">Boot verfügbar</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1 shadow-button">
              {isEditMode ? "Aktualisieren" : "Hinzufügen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}