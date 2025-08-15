import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ship, Users, Edit, Trash2 } from "lucide-react";
import { Boat } from "@/types/booking";
import { boats as initialBoats } from "@/data/dataService";
import { BoatModal } from "@/components/boats/BoatModal";

export default function Boats() {
  const [boats, setBoats] = useState<Boat[]>(initialBoats);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  const handleAddBoat = () => {
    setSelectedBoat(null);
    setIsModalOpen(true);
  };

  const handleEditBoat = (boat: Boat) => {
    setSelectedBoat(boat);
    setIsModalOpen(true);
  };

  const handleSaveBoat = (boatData: Omit<Boat, 'id'>) => {
    if (selectedBoat) {
      // Update existing boat
      setBoats(prev => prev.map(boat => 
        boat.id === selectedBoat.id ? { ...boatData, id: selectedBoat.id } : boat
      ));
    } else {
      // Add new boat
      const newBoat: Boat = {
        ...boatData,
        id: Date.now().toString()
      };
      setBoats(prev => [...prev, newBoat]);
    }
    setIsModalOpen(false);
    setSelectedBoat(null);
  };

  const handleDeleteBoat = (boatId: string) => {
    setBoats(prev => prev.filter(boat => boat.id !== boatId));
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Boote verwalten</h1>
          <Button 
            onClick={handleAddBoat}
            className="flex items-center gap-2 shadow-button"
          >
            <Plus className="h-4 w-4" />
            Neues Boot
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boats.map((boat) => (
            <Card key={boat.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Ship className="h-5 w-5" />
                    {boat.name}
                  </CardTitle>
                  <Badge variant={boat.available ? "default" : "secondary"}>
                    {boat.available ? "Verfügbar" : "Nicht verfügbar"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Typ:</strong> {boat.type}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <strong>Kapazität:</strong> {boat.capacity} Personen
                  </p>
                  {boat.description && (
                    <p className="text-sm text-muted-foreground">
                      {boat.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBoat(boat)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBoat(boat.id)}
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

        {boats.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ship className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Keine Boote vorhanden
              </h3>
              <p className="text-muted-foreground mb-4">
                Fügen Sie Ihr erstes Boot hinzu, um mit der Verwaltung zu beginnen.
              </p>
              <Button onClick={handleAddBoat}>
                <Plus className="h-4 w-4 mr-2" />
                Boot hinzufügen
              </Button>
            </CardContent>
          </Card>
        )}

        <BoatModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBoat(null);
          }}
          boat={selectedBoat}
          onSave={handleSaveBoat}
        />
      </div>
    </AppLayout>
  );
}