import { useState, useCallback, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/de";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingModal } from "./BookingModal";
import { Boat, CalendarEvent, BookingData, Captain, PublicTour, TourType } from "@/types/booking";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Setup German locale (week starts Monday, Mon-Sun)
moment.updateLocale("de", { week: { dow: 1, doy: 4 } });
moment.locale("de");
const localizer = momentLocalizer(moment);

const messages = {
  allDay: "Ganztägig",
  previous: "Zurück",
  next: "Weiter", 
  today: "Heute",
  month: "Monat",
  week: "Woche",
  day: "Tag",
  agenda: "Agenda",
  date: "Datum",
  time: "Zeit",
  event: "Termin",
  noEventsInRange: "Keine Termine in diesem Zeitraum",
  showMore: (total: number) => `+ ${total} weitere`
};

export function BookingCalendar() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [publicTours, setPublicTours] = useState<PublicTour[]>([]);
  const [tourTypes, setTourTypes] = useState<TourType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    Promise.all([
      api.listBookings(),
      api.listBoats(),
      api.listCaptains(),
      api.listPublicTours({ includeCancelled: true }),
      api.listTourTypes(),
    ])
      .then(([bookingData, boatData, captainData, ptData, ttData]) => {
        setBookings(bookingData);
        setBoats(boatData);
        setCaptains(captainData);
        setPublicTours(ptData);
        setTourTypes(ttData);
      })
      .catch((error) => toast({
        title: "Kalenderdaten konnten nicht geladen werden",
        description: error.message,
        variant: "destructive",
      }));
  }, [toast]);

  // Convert bookings to calendar events. Bookings that belong to a public
  // tour (ticket purchases) are NOT shown as separate events — they are
  // listed underneath the public tour itself.
  const bookingEvents: CalendarEvent[] = bookings
    .filter(booking => !booking.publicTourId)
    .map(booking => {
    const boat = boats.find(b => b.id === booking.boatId);
    return {
      id: booking.id,
      title: `${booking.customer.name} • ${boat?.name || 'Boot'} (${booking.participants} P.)`,
      start: booking.startDate,
      end: booking.endDate,
      resource: booking
    };
  });

  const publicTourEvents: CalendarEvent[] = publicTours.map((pt) => {
    const boat = boats.find((b) => b.id === pt.boatId);
    const tt = tourTypes.find((t) => t.id === pt.tourTypeId);
    const cap = captains.find((c) => c.id === pt.captainId);
    const cancelled = pt.status === "cancelled";
    const title = cancelled
      ? `❌ ${tt?.name || "Tour"} – ${pt.cancellationReason || "abgesagt"}`
      : `${tt?.name || "Tour"} • ${boat?.name || "Boot"} • ${pt.seatsBooked}/${pt.seatsTotal}${cap ? ` • ${cap.name}` : ""}`;
    return {
      id: `pt-${pt.id}`,
      title,
      start: pt.startDate,
      end: pt.endDate,
      resource: {
        id: `pt-${pt.id}`,
        startDate: pt.startDate,
        endDate: pt.endDate,
        customer: { name: tt?.name || "Tour", email: "", phone: "" },
        participants: pt.seatsBooked,
        boatId: pt.boatId,
        captainId: pt.captainId || "",
        catering: false,
        tourType: (tt?.category === "event" ? "event" : "rundfahrt"),
        status: cancelled ? "cancelled" : "confirmed",
        createdAt: new Date(),
      } as BookingData,
    };
  });

  const events: CalendarEvent[] = [...bookingEvents, ...publicTourEvents];

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (typeof event.id === "string" && event.id.startsWith("pt-")) {
      // Public tour: navigate handled separately; for now just show toast
      toast({ title: event.title, description: "Öffentlicher Termin – Bearbeitung im Bereich Öffentl. Termine bzw. Events." });
      return;
    }
    setSelectedEvent(event);
    setSelectedSlot(null);
    setIsModalOpen(true);
  }, [toast]);

  const handleSaveBooking = useCallback(async (bookingData: Omit<BookingData, 'id' | 'createdAt'>) => {
    try {
      const newBooking = await api.createBooking(bookingData);
      setBookings(prev => [...prev, newBooking]);
      setIsModalOpen(false);
      setSelectedSlot(null);
      setSelectedEvent(null);
    } catch (error) {
      toast({
        title: "Buchung konnte nicht gespeichert werden",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const handleUpdateBooking = useCallback(async (updatedBooking: BookingData) => {
    try {
      const savedBooking = await api.updateBooking(updatedBooking);
      setBookings(prev => prev.map(booking => 
        booking.id === savedBooking.id ? savedBooking : booking
      ));
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast({
        title: "Buchung konnte nicht aktualisiert werden",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const handleDeleteBooking = useCallback(async (bookingId: string) => {
    try {
      await api.deleteBooking(bookingId);
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast({
        title: "Buchung konnte nicht gelöscht werden",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const booking = event.resource;
    let backgroundColor = "hsl(210 100% 35%)";
    let color = "white";

    if (booking.status === "cancelled") {
      backgroundColor = "hsl(0 84% 50%)";
    } else if (booking.tourType === "rundfahrt") {
      backgroundColor = "hsl(190 80% 40%)"; // turquoise
    } else if (booking.tourType === "event") {
      backgroundColor = "hsl(280 60% 50%)"; // purple
    } else if (booking.status === "pending") {
      backgroundColor = "hsl(38 92% 50%)";
    } else {
      backgroundColor = "hsl(210 100% 35%)"; // charter
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 1,
        color,
        border: "1px solid rgba(255, 255, 255, 0.3)",
        display: "block",
        fontWeight: "500"
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Bootstour Kalender</h1>
      </div>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <span>Buchungsübersicht</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              messages={messages}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              popup
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              defaultView={Views.MONTH}
              eventPropGetter={eventStyleGetter}
              className={cn(
                "rbc-calendar",
                "[&_.rbc-toolbar]:mb-4",
                "[&_.rbc-btn-group>.rbc-button]:bg-secondary [&_.rbc-btn-group>.rbc-button]:text-secondary-foreground",
                "[&_.rbc-btn-group>.rbc-button.rbc-active]:bg-primary [&_.rbc-btn-group>.rbc-button.rbc-active]:text-primary-foreground",
                "[&_.rbc-month-view]:border-border",
                "[&_.rbc-day-bg]:border-border [&_.rbc-day-bg.rbc-today]:bg-water-light",
                "[&_.rbc-event]:shadow-sm"
              )}
            />
          </div>
        </CardContent>
      </Card>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
          setSelectedEvent(null);
        }}
        selectedSlot={selectedSlot}
        selectedEvent={selectedEvent}
        boats={boats}
        captains={captains}
        bookings={bookings}
        onSave={handleSaveBooking}
        onUpdate={handleUpdateBooking}
        onDelete={handleDeleteBooking}
      />
    </div>
  );
}
