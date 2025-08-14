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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Captain } from "@/types/booking";
import { mockBoats } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface CaptainModalProps {
  isOpen: boolean;
  onClose: () => void;
  captain: Captain | null;
  onSave: (captainData: Omit<Captain, 'id'>) => void;
}

const commonCertifications = [
  "Sportbootführerschein Binnen",
  "Sportbootführerschein See", 
  "Kapitänspatent",
  "Funkzeugnis",
  "Erste Hilfe",
  "Fischereischein",
  "Personenbeförderung"
];

export function CaptainModal({ isOpen, onClose, captain, onSave }: CaptainModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    certifications: [] as string[],
    availableBoats: [] as string[]
  });
  const [newCertification, setNewCertification] = useState("");

  const isEditMode = !!captain;

  useEffect(() => {
    if (captain) {
      setFormData({
        name: captain.name,
        email: captain.email,
        phone: captain.phone,
        certifications: [...captain.certifications],
        availableBoats: [...captain.availableBoats]
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        certifications: [],
        availableBoats: []
      });
    }
  }, [captain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
    toast({
      title: isEditMode ? "Bootsführer aktualisiert" : "Bootsführer hinzugefügt",
      description: `${formData.name} wurde erfolgreich ${isEditMode ? "aktualisiert" : "hinzugefügt"}.`
    });
  };

  const addCertification = (cert: string) => {
    if (cert && !formData.certifications.includes(cert)) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, cert]
      });
    }
  };

  const removeCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter(c => c !== cert)
    });
  };

  const addCustomCertification = () => {
    if (newCertification.trim()) {
      addCertification(newCertification.trim());
      setNewCertification("");
    }
  };

  const handleBoatChange = (boatId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        availableBoats: [...formData.availableBoats, boatId]
      });
    } else {
      setFormData({
        ...formData,
        availableBoats: formData.availableBoats.filter(id => id !== boatId)
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditMode ? "Bootsführer bearbeiten" : "Neuen Bootsführer hinzufügen"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grunddaten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Klaus Müller"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="k.mueller@bootstour.de"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+49 5921 123456"
              required
            />
          </div>

          {/* Zertifizierungen */}
          <div>
            <Label className="text-base font-semibold">Zertifizierungen</Label>
            
            {/* Aktuelle Zertifizierungen */}
            {formData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {formData.certifications.map((cert) => (
                  <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Standard-Zertifizierungen */}
            <div className="space-y-2 mb-3">
              <p className="text-sm text-muted-foreground">Häufige Zertifizierungen:</p>
              <div className="flex flex-wrap gap-2">
                {commonCertifications
                  .filter(cert => !formData.certifications.includes(cert))
                  .map((cert) => (
                    <Button
                      key={cert}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addCertification(cert)}
                    >
                      + {cert}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Benutzerdefinierte Zertifizierung hinzufügen */}
            <div className="flex gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Benutzerdefinierte Zertifizierung..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCertification())}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomCertification}
              >
                Hinzufügen
              </Button>
            </div>
          </div>

          {/* Verfügbare Boote */}
          <div>
            <Label className="text-base font-semibold">Verfügbare Boote</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Wählen Sie die Boote aus, die dieser Bootsführer bedienen kann.
            </p>
            <div className="space-y-2">
              {mockBoats.map((boat) => (
                <div key={boat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`boat-${boat.id}`}
                    checked={formData.availableBoats.includes(boat.id)}
                    onCheckedChange={(checked) => handleBoatChange(boat.id, checked as boolean)}
                  />
                  <Label htmlFor={`boat-${boat.id}`} className="flex-1">
                    {boat.name} - {boat.type} (max. {boat.capacity} Personen)
                  </Label>
                </div>
              ))}
            </div>
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