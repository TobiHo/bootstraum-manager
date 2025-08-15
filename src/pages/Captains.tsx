import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Ship, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { Captain } from "@/types/booking";
import { captains as initialCaptains, boats } from "@/data/dataService";
import { CaptainModal } from "@/components/captains/CaptainModal";

export default function Captains() {
  const [captains, setCaptains] = useState<Captain[]>(initialCaptains);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCaptain, setSelectedCaptain] = useState<Captain | null>(null);

  const handleAddCaptain = () => {
    setSelectedCaptain(null);
    setIsModalOpen(true);
  };

  const handleEditCaptain = (captain: Captain) => {
    setSelectedCaptain(captain);
    setIsModalOpen(true);
  };

  const handleSaveCaptain = (captainData: Omit<Captain, 'id'>) => {
    if (selectedCaptain) {
      // Update existing captain
      setCaptains(prev => prev.map(captain => 
        captain.id === selectedCaptain.id ? { ...captainData, id: selectedCaptain.id } : captain
      ));
    } else {
      // Add new captain
      const newCaptain: Captain = {
        ...captainData,
        id: Date.now().toString()
      };
      setCaptains(prev => [...prev, newCaptain]);
    }
    setIsModalOpen(false);
    setSelectedCaptain(null);
  };

  const handleDeleteCaptain = (captainId: string) => {
    setCaptains(prev => prev.filter(captain => captain.id !== captainId));
  };

  const getBoatNames = (boatIds: string[]) => {
    return boatIds
      .map(id => boats.find(boat => boat.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Bootsführer verwalten</h1>
          <Button 
            onClick={handleAddCaptain}
            className="flex items-center gap-2 shadow-button"
          >
            <Plus className="h-4 w-4" />
            Neuer Bootsführer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {captains.map((captain) => (
            <Card key={captain.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  {captain.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {captain.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {captain.phone}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Zertifizierungen:</h4>
                  <div className="flex flex-wrap gap-1">
                    {captain.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Ship className="h-4 w-4" />
                    Verfügbare Boote:
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getBoatNames(captain.availableBoats) || "Keine Boote zugeordnet"}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCaptain(captain)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCaptain(captain.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {captains.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Keine Bootsführer vorhanden
              </h3>
              <p className="text-muted-foreground mb-4">
                Fügen Sie Ihren ersten Bootsführer hinzu, um mit der Verwaltung zu beginnen.
              </p>
              <Button onClick={handleAddCaptain}>
                <Plus className="h-4 w-4 mr-2" />
                Bootsführer hinzufügen
              </Button>
            </CardContent>
          </Card>
        )}

        <CaptainModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCaptain(null);
          }}
          captain={selectedCaptain}
          onSave={handleSaveCaptain}
        />
      </div>
    </AppLayout>
  );
}