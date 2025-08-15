import { useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/de";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingModal } from "./BookingModal";
import { CalendarEvent, BookingData } from "@/types/booking";
import { bookings as initialBookings } from "@/data/dataService";
import { cn } from "@/lib/utils";

// Setup German locale
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
  const [bookings, setBookings] = useState<BookingData[]>(initialBookings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Convert bookings to calendar events
  const events: CalendarEvent[] = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.customer.name} (${booking.participants} Pers.)`,
    start: booking.startDate,
    end: booking.endDate,
    resource: booking
  }));

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setIsModalOpen(true);
  }, []);

  const handleSaveBooking = useCallback((bookingData: Omit<BookingData, 'id' | 'createdAt'>) => {
    const newBooking: BookingData = {
      ...bookingData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    setBookings(prev => [...prev, newBooking]);
    setIsModalOpen(false);
    setSelectedSlot(null);
    setSelectedEvent(null);
  }, []);

  const handleUpdateBooking = useCallback((updatedBooking: BookingData) => {
    setBookings(prev => prev.map(booking => 
      booking.id === updatedBooking.id ? updatedBooking : booking
    ));
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleDeleteBooking = useCallback((bookingId: string) => {
    setBookings(prev => prev.filter(booking => booking.id !== bookingId));
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    const booking = event.resource;
    let backgroundColor = "hsl(var(--primary))";
    
    switch (booking.status) {
      case "pending":
        backgroundColor = "hsl(var(--muted))";
        break;
      case "cancelled":
        backgroundColor = "hsl(var(--destructive))";
        break;
      default:
        backgroundColor = "hsl(var(--primary))";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block"
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
        onSave={handleSaveBooking}
        onUpdate={handleUpdateBooking}
        onDelete={handleDeleteBooking}
      />
    </div>
  );
}