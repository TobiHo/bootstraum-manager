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
import { Card } from "@/components/ui/card";
import { Boat, CalendarEvent, BookingData, Captain, Customer } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertCircle } from "lucide-react";
import { TOUR_TYPES, calculatePrice, getDurationHours, formatPrice } from "@/lib/pricing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { start: Date; end: Date } | null;
  selectedEvent: CalendarEvent | null;
  boats: Boat[];
  captains: Captain[];
  bookings: BookingData[];
  onSave: (bookingData: Omit<BookingData, 'id' | 'createdAt'>) => Promise<void>;
  onUpdate: (bookingData: BookingData) => Promise<void>;
  onDelete: (bookingId: string) => Promise<void>;
}

export function BookingModal({
  isOpen,
  onClose,
  selectedSlot,
  selectedEvent,
  boats,
  captains,
  bookings,
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
  const [tourType, setTourType] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
             booking.status !== 'cancelled' &&
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
             booking.status !== 'cancelled' &&
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
      setTourType(booking.tourType || "");
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
    setTourType("");
    setStartDate("");
    setEndDate("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!startDate) newErrors.startDate = "Startzeit erforderlich";
    if (!endDate) newErrors.endDate = "Endzeit erforderlich";
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = "Endzeit muss nach Startzeit liegen";
    }

    if (!customer.name?.trim()) newErrors.customerName = "Name erforderlich";
    if (!customer.email?.trim()) newErrors.customerEmail = "E-Mail erforderlich";
    else if (!customer.email.includes("@")) newErrors.customerEmail = "Gültige E-Mail erforderlich";
    if (!customer.phone?.trim()) newErrors.customerPhone = "Telefon erforderlich";

    if (participants < 1) newErrors.participants = "Mindestens 1 Teilnehmer erforderlich";
    if (!selectedBoatId) newErrors.boatId = "Boot erforderlich";
    if (!selectedCaptainId) newErrors.captainId = "Bootsführer erforderlich";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      document.getElementById(firstErrorKey)?.focus?.();
      toast({
        title: "Validierungsfehler",
        description: "Bitte überprüfen Sie die markierten Felder.",
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
      tourType,
      status: "confirmed"
    };

    // Warn if booking is in the past
    if (bookingData.startDate < new Date()) {
      toast({
        title: "Warnung",
        description: "Diese Buchung liegt in der Vergangenheit. Sie können sie trotzdem speichern.",
        variant: "default"
      });
    }

    if (isEditMode && selectedEvent) {
      await onUpdate({
        ...bookingData,
        id: selectedEvent.resource.id,
        createdAt: selectedEvent.resource.createdAt
      });
      toast({
        title: "Buchung aktualisiert",
        description: "Die Buchung wurde erfolgreich aktualisiert."
      });
    } else {
      await onSave(bookingData);
      toast({
        title: "Buchung erstellt",
        description: "Die Buchung wurde erfolgreich erstellt."
      });
    }
    setErrors({});
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      await onDelete(selectedEvent.resource.id);
      toast({
        title: "Buchung gelöscht",
        description: "Die Buchung wurde erfolgreich gelöscht."
      });
    }
  };

  const handleCancel = async () => {
    if (selectedEvent) {
      try {
        await (window as any).__api.cancelBooking(selectedEvent.resource.id);
        setShowCancelConfirm(false);
        toast({
          title: "Buchung storniert",
          description: "Die Buchung wurde storniert und Benachrichtigungen wurden versendet."
        });
        handleClose();
        window.location.reload();
      } catch (error) {
        setShowCancelConfirm(false);
        toast({
          title: "Fehler",
          description: error instanceof Error ? error.message : "Buchung konnte nicht storniert werden",
          variant: "destructive"
        });
      }
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
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <Label htmlFor="endDate">Endzeit *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={errors.endDate ? "border-destructive" : ""}
              />
              {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate}</p>}
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
                  className={errors.customerName ? "border-destructive" : ""}
                />
                {errors.customerName && <p className="text-xs text-destructive mt-1">{errors.customerName}</p>}
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
                  className={errors.customerEmail ? "border-destructive" : ""}
                />
                {errors.customerEmail && <p className="text-xs text-destructive mt-1">{errors.customerEmail}</p>}
              </div>
              <div>
                <Label htmlFor="customerPhone">Telefon *</Label>
                <Input
                  id="customerPhone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  placeholder="+49 5921 123456"
                  className={errors.customerPhone ? "border-destructive" : ""}
                />
                {errors.customerPhone && <p className="text-xs text-destructive mt-1">{errors.customerPhone}</p>}
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
              className={errors.participants ? "border-destructive" : ""}
            />
            {errors.participants && <p className="text-xs text-destructive mt-1">{errors.participants}</p>}
          </div>

          {/* Tourtyp-Auswahl */}
          <div>
            <Label htmlFor="tourType">Tourtyp</Label>
            <Select value={tourType} onValueChange={setTourType}>
              <SelectTrigger>
                <SelectValue placeholder="Tourtyp auswählen (optional)" />
              </SelectTrigger>
              <SelectContent>
                {TOUR_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} - {type.pricingHint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing Display */}
          {tourType && startDate && endDate && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Geschätzter Preis:</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(calculatePrice(tourType, participants, boats.find(b => b.id === selectedBoatId)?.capacity || 25, getDurationHours(startDate, endDate)))}
                </span>
              </div>
            </Card>
          )}

          {/* Boot-Auswahl */}
          <div>
            <Label htmlFor="boat">Boot auswählen *</Label>
            <Select value={selectedBoatId} onValueChange={(value) => {
              setSelectedBoatId(value);
              if (errors.boatId) setErrors({...errors, boatId: ""});
            }}>
              <SelectTrigger className={errors.boatId ? "border-destructive" : ""}>
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
            {errors.boatId && <p className="text-xs text-destructive mt-1">{errors.boatId}</p>}
            {participants > 0 && availableBoats.length === 0 && !errors.boatId && (
              <p className="text-sm text-destructive mt-1">
                Keine Boote für {participants} Personen verfügbar
              </p>
            )}

            {/* Occupancy Indicator */}
            {selectedBoatId && (
              <div className="mt-3 p-3 bg-secondary/50 rounded-md">
                {(() => {
                  const boat = boats.find(b => b.id === selectedBoatId);
                  const occupancyPercent = boat ? (participants / boat.capacity) * 100 : 0;
                  const isWarning = occupancyPercent >= 80;
                  return (
                    <>
                      <p className={`text-sm font-medium ${isWarning ? "text-amber-600" : "text-foreground"}`}>
                        Kapazität: {participants}/{boat?.capacity} Plätze ({occupancyPercent.toFixed(0)}%)
                      </p>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${isWarning ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Bootsführer-Auswahl */}
          <div>
            <Label htmlFor="captain">Bootsführer auswählen *</Label>
            <Select
              value={selectedCaptainId}
              onValueChange={(value) => {
                setSelectedCaptainId(value);
                if (errors.captainId) setErrors({...errors, captainId: ""});
              }}
              disabled={!selectedBoatId}
            >
              <SelectTrigger className={errors.captainId ? "border-destructive" : ""}>
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
            {errors.captainId && <p className="text-xs text-destructive mt-1">{errors.captainId}</p>}
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
            <div className="flex gap-2">
              {isEditMode && (
                <>
                  <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-orange-600 border-orange-200"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Stornieren
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Buchung stornieren?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Buchung wird storniert und der Bootsführer sowie der Kunde werden per E-Mail und WhatsApp benachrichtigt.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-2">
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ja, stornieren
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Löschen
                  </Button>
                </>
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
