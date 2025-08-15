import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
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
import { CalendarEvent, BookingData, Customer } from "@/types/booking";
import { boats, captains, bookings } from "@/data/dataService";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { start: Date; end: Date } | null;
  selectedEvent: CalendarEvent | null;
  onSave: (bookingData: Omit<BookingData, 'id' | 'createdAt'>) => void;
  onUpdate: (bookingData: BookingData) => void;
  onDelete: (bookingId: string) => void;
}

export function BookingModal({
  isOpen,
  onClose,
  selectedSlot,
  selectedEvent,
  onSave,
  onUpdate,
  onDelete
}: BookingModalProps) {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
    company: ""
  });
  const [participants, setParticipants] = useState<number>(1);
  const [selectedBoatId, setSelectedBoatId] = useState<string>("");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>("");
  const [catering, setCatering] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const isEditMode = !!selectedEvent;

  // Helper function to check if dates overlap
  const datesOverlap = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return start1 < end2 && end1 > start2;
  };

  // Get selected time range
  const selectedStartTime = startDate ? new Date(startDate) : null;
  const selectedEndTime = endDate ? new Date(endDate) : null;

  // Filter boats by capacity and availability during selected time
  const availableBoats = boats.filter(boat => {
    if (!boat.available || boat.capacity < participants) {
      return false;
    }

    // Skip time overlap check if no time selected yet
    if (!selectedStartTime || !selectedEndTime) {
      return true;
    }

    // Check if boat is already booked during selected time
    const isBoatBooked = bookings.some(booking => {
      // Skip current booking if editing
      if (isEditMode && selectedEvent && booking.id === selectedEvent.resource.id) {
        return false;
      }
      
      return booking.boatId === boat.id && 
             booking.status === 'confirmed' &&
             datesOverlap(selectedStartTime, selectedEndTime, booking.startDate, booking.endDate);
    });

    return !isBoatBooked;
  });

  // Filter captains by selected boat and availability during selected time
  const availableCaptains = captains.filter(captain => {
    if (selectedBoatId && !captain.availableBoats.includes(selectedBoatId)) {
      return false;
    }

    // Skip time overlap check if no time selected yet
    if (!selectedStartTime || !selectedEndTime) {
      return selectedBoatId ? captain.availableBoats.includes(selectedBoatId) : true;
    }

    // Check if captain is already booked during selected time
    const isCaptainBooked = bookings.some(booking => {
      // Skip current booking if editing
      if (isEditMode && selectedEvent && booking.id === selectedEvent.resource.id) {
        return false;
      }
      
      return booking.captainId === captain.id && 
             booking.status === 'confirmed' &&
             datesOverlap(selectedStartTime, selectedEndTime, booking.startDate, booking.endDate);
    });

    return !isCaptainBooked;
  });

  useEffect(() => {
    if (selectedSlot) {
      setStartDate(format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm"));
      setEndDate(format(selectedSlot.end, "yyyy-MM-dd'T'HH:mm"));
    } else if (selectedEvent) {
      const booking = selectedEvent.resource;
      setCustomer(booking.customer);
      setParticipants(booking.participants);
      setSelectedBoatId(booking.boatId);
      setSelectedCaptainId(booking.captainId);
      setCatering(booking.catering);
      setNotes(booking.notes || "");
      setStartDate(format(booking.startDate, "yyyy-MM-dd'T'HH:mm"));
      setEndDate(format(booking.endDate, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [selectedSlot, selectedEvent]);

  const resetForm = () => {
    setCustomer({ name: "", email: "", phone: "", company: "" });
    setParticipants(1);
    setSelectedBoatId("");
    setSelectedCaptainId("");
    setCatering(false);
    setNotes("");
    setStartDate("");
    setEndDate("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    if (!customer.name || !customer.email || !customer.phone || !selectedBoatId || !selectedCaptainId) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    const bookingData: Omit<BookingData, 'id' | 'createdAt'> = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      customer,
      participants,
      boatId: selectedBoatId,
      captainId: selectedCaptainId,
      catering,
      notes,
      status: "confirmed"
    };

    if (isEditMode && selectedEvent) {
      onUpdate({
        ...bookingData,
        id: selectedEvent.resource.id,
        createdAt: selectedEvent.resource.createdAt
      });
      toast({
        title: "Buchung aktualisiert",
        description: "Die Buchung wurde erfolgreich aktualisiert."
      });
    } else {
      onSave(bookingData);
      toast({
        title: "Buchung erstellt",
        description: "Die Buchung wurde erfolgreich erstellt."
      });
    }
  };

  const handleDelete = () => {
    if (selectedEvent) {
      onDelete(selectedEvent.resource.id);
      toast({
        title: "Buchung gelöscht",
        description: "Die Buchung wurde erfolgreich gelöscht."
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditMode ? "Buchung bearbeiten" : "Neue Buchung erstellen"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zeitraum */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Startzeit *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Endzeit *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Kundendaten */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Kundendaten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Name / Firma *</Label>
                <Input
                  id="customerName"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  placeholder="Max Mustermann / Firma GmbH"
                />
              </div>
              <div>
                <Label htmlFor="customerCompany">Zusätzliche Firma</Label>
                <Input
                  id="customerCompany"
                  value={customer.company}
                  onChange={(e) => setCustomer({...customer, company: e.target.value})}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">E-Mail *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  placeholder="mail@example.de"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Telefon *</Label>
                <Input
                  id="customerPhone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  placeholder="+49 5921 123456"
                />
              </div>
            </div>
          </div>

          {/* Teilnehmerzahl */}
          <div>
            <Label htmlFor="participants">Anzahl Teilnehmer *</Label>
            <Input
              id="participants"
              type="number"
              min="1"
              value={participants}
              onChange={(e) => setParticipants(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Boot-Auswahl */}
          <div>
            <Label htmlFor="boat">Boot auswählen *</Label>
            <Select value={selectedBoatId} onValueChange={setSelectedBoatId}>
              <SelectTrigger>
                <SelectValue placeholder="Boot auswählen" />
              </SelectTrigger>
              <SelectContent>
                {availableBoats.map(boat => (
                  <SelectItem key={boat.id} value={boat.id}>
                    {boat.name} - {boat.type} (max. {boat.capacity} Personen)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {participants > 0 && availableBoats.length === 0 && (
              <p className="text-sm text-destructive mt-1">
                Keine Boote für {participants} Personen verfügbar
              </p>
            )}
          </div>

          {/* Bootsführer-Auswahl */}
          <div>
            <Label htmlFor="captain">Bootsführer auswählen *</Label>
            <Select 
              value={selectedCaptainId} 
              onValueChange={setSelectedCaptainId}
              disabled={!selectedBoatId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bootsführer auswählen" />
              </SelectTrigger>
              <SelectContent>
                {availableCaptains.map(captain => (
                  <SelectItem key={captain.id} value={captain.id}>
                    {captain.name} - {captain.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verpflegung */}
          <div className="flex items-center space-x-2">
            <Switch
              id="catering"
              checked={catering}
              onCheckedChange={setCatering}
            />
            <Label htmlFor="catering">Verpflegung gewünscht *</Label>
          </div>

          {/* Notizen */}
          <div>
            <Label htmlFor="notes">Bemerkungen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen zur Buchung..."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {isEditMode && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} className="shadow-button">
                {isEditMode ? "Aktualisieren" : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}