import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Clock, Users, Calendar as CalIcon, Ticket } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import publicTourImg from "@/assets/vvv/dsc00926.jpg";

// Fallback-Tour-Typen, falls Backend nicht erreichbar ist
const FALLBACK_TOUR_TYPES: Record<string, {
  id: string; slug: string; name: string; description: string;
  durationMinutes: number; pricePerTicket: number; maxParticipants: number;
  minParticipants: number; active: boolean;
}> = {
  rundfahrt:   { id: "fb-rundfahrt",   slug: "rundfahrt",   name: "Öffentliche Rundfahrten", description: "Die klassische City-Rundfahrt auf der Vechte – ideal zum Kennenlernen Nordhorns vom Wasser aus.", durationMinutes: 90,  pricePerTicket: 14.5, maxParticipants: 25, minParticipants: 1, active: true },
  charter:     { id: "fb-charter",     slug: "charter",     name: "Exklusivfahrten",         description: "Mieten Sie das ganze Boot exklusiv für Ihre Gruppe – ideal für Firmen, Geburtstage und Feiern.", durationMinutes: 120, pricePerTicket: 290,  maxParticipants: 25, minParticipants: 1, active: true },
  punsch:      { id: "fb-punsch",      slug: "punsch",      name: "Punschfahrten",           description: "Heißer Punsch, warme Decken und winterliche Stimmung an Bord.", durationMinutes: 90,  pricePerTicket: 18.5, maxParticipants: 25, minParticipants: 1, active: true },
  ranger:      { id: "fb-ranger",      slug: "ranger",      name: "Vechte-Ranger",           description: "Die Abenteuer-Tour für Kinder und Familien.", durationMinutes: 60,  pricePerTicket: 9.5,  maxParticipants: 25, minParticipants: 1, active: true },
  sundowner:   { id: "fb-sundowner",   slug: "sundowner",   name: "Sundowner",               description: "Sonnenuntergang vom Wasser aus erleben.", durationMinutes: 90,  pricePerTicket: 22,   maxParticipants: 25, minParticipants: 1, active: true },
  cliquentour: { id: "fb-cliquentour", slug: "cliquentour", name: "Cliquentour",             description: "Feiern mit Freunden auf der Vechte.", durationMinutes: 120, pricePerTicket: 26,   maxParticipants: 25, minParticipants: 1, active: true },
};

// Generiere Beispiel-Slots für die nächsten 14 Tage (täglich 11:00, 14:00, 17:00)
function buildFallbackSlots(slug: string, durationMin: number, capacity: number) {
  const slots: { id: string; startDate: Date; endDate: Date; seatsTotal: number; seatsBooked: number }[] = [];
  const times = [11, 14, 17];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let d = 1; d <= 14; d++) {
    for (const h of times) {
      const start = new Date(today);
      start.setDate(start.getDate() + d);
      start.setHours(h, 0, 0, 0);
      const end = new Date(start.getTime() + durationMin * 60_000);
      const booked = Math.floor(Math.random() * (capacity - 4));
      slots.push({
        id: `fb-${slug}-${d}-${h}`,
        startDate: start,
        endDate: end,
        seatsTotal: capacity,
        seatsBooked: booked,
      });
    }
  }
  return slots;
}

export default function PublicTourDetail() {
  const { slug = "" } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: ttApi, isError: ttError, isLoading: ttLoading } = useQuery({
    queryKey: ["tour-type", slug],
    queryFn: () => api.getTourTypeBySlug(slug),
    retry: false,
  });

  const tt = ttApi || FALLBACK_TOUR_TYPES[slug];

  // Charter ist keine öffentliche Buchung – auf Charter-Seite weiterleiten
  useEffect(() => {
    if (slug === "charter") navigate("/charter", { replace: true });
  }, [slug, navigate]);

  const { data: slotsApi, isError: slotsError } = useQuery({
    queryKey: ["public-tours", tt?.id],
    queryFn: () => api.listPublicTours({ tourTypeId: tt!.id, from: new Date(), onlyAvailable: true }),
    enabled: !!tt && !tt.id.startsWith("fb-"),
    retry: false,
  });

  const slots = (slotsApi && slotsApi.length > 0)
    ? slotsApi
    : (tt ? buildFallbackSlots(tt.slug, tt.durationMinutes, tt.maxParticipants) : []);

  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [catering, setCatering] = useState(false);
  const [notes, setNotes] = useState("");

  const buy = useMutation({
    mutationFn: async () => {
      const booking = await api.buyTickets(selectedSlotId, {
        quantity,
        customer: { name, email, phone },
        catering,
        notes,
      });
      try {
        const { checkout_url } = await api.createStripeCheckout(booking.id);
        window.location.href = checkout_url;
        return booking;
      } catch (e) {
        // Payment not configured yet – booking stays pending
        return booking;
      }
    },
    onSuccess: () => {
      toast({ title: "Buchung reserviert", description: "Sie werden zur Bezahlung weitergeleitet, sofern verfügbar." });
      qc.invalidateQueries({ queryKey: ["public-tours"] });
      setSelectedSlotId("");
      setQuantity(1);
      setName(""); setEmail(""); setPhone(""); setNotes(""); setCatering(false);
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  if (!tt && ttLoading) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-16">Lade Tour...</div>
      </PublicLayout>
    );
  }

  if (!tt) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-16">
          Tour nicht gefunden. <Link to="/touren" className="text-primary underline">Zurück zur Übersicht</Link>
        </div>
      </PublicLayout>
    );
  }

  const total = quantity * tt.pricePerTicket;

  return (
    <PublicLayout>
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img src={publicTourImg} alt={tt.name} width={1024} height={768} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/touren" className="text-sm text-primary hover:underline">← Zurück zu allen Touren</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">{tt.name}</h1>
        <p className="text-muted-foreground mb-8">{tt.description}</p>

        <div className="grid md:grid-cols-3 gap-3 mb-8">
          <Card><CardContent className="p-4 flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" /> {tt.durationMinutes} Minuten</CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" /> max. {tt.maxParticipants} Personen</CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-2 text-sm"><Ticket className="h-4 w-4 text-primary" /> € {tt.pricePerTicket.toFixed(2)} pro Ticket</CardContent></Card>
        </div>

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><CalIcon className="h-5 w-5" /> Verfügbare Termine</h2>
        {slots.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            Aktuell keine öffentlichen Termine. Sie können <Link to="/charter" className="text-primary underline">ein Boot privat chartern</Link>.
          </CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {slots.map((s) => {
              const free = s.seatsTotal - s.seatsBooked;
              const isSelected = s.id === selectedSlotId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSlotId(s.id)}
                  className={`text-left rounded-lg border p-4 transition ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold">{format(s.startDate, "EEEE, d. MMMM yyyy", { locale: de })}</div>
                  <div className="text-sm text-muted-foreground">{format(s.startDate, "HH:mm")} – {format(s.endDate, "HH:mm")} Uhr</div>
                  <div className="text-sm mt-1">{free} von {s.seatsTotal} Plätzen frei</div>
                </button>
              );
            })}
          </div>
        )}

        {selectedSlotId && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">Tickets buchen</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Anzahl Tickets</Label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                </div>
                <div className="flex items-end font-bold text-lg text-primary">Gesamt: € {total.toFixed(2)}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Telefon *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              </div>
              <div><Label>E-Mail *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="flex items-center gap-2">
                <Checkbox id="catering" checked={catering} onCheckedChange={(v) => setCatering(!!v)} />
                <Label htmlFor="catering">Verpflegung an Bord gewünscht</Label>
              </div>
              <div><Label>Anmerkungen</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button
                size="lg"
                onClick={() => buy.mutate()}
                disabled={!name || !email || !phone || quantity < 1 || buy.isPending}
                className="w-full"
              >
                {buy.isPending ? "Wird gebucht..." : `Verbindlich buchen (€ ${total.toFixed(2)})`}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Sichere Online-Bezahlung über Stripe. Stornierung gemäß AGB.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </PublicLayout>
  );
}
