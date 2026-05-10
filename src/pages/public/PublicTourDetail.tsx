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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/lib/api";
import { Clock, Users, Calendar as CalIcon, Ticket } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import publicTourImg from "@/assets/vvv/dsc00926.jpg";

// Touren mit individuellem Buchungs-/Anfrageprozess (kein öffentlicher Slot-Verkauf)
const SPECIAL_TOUR_SLUGS = new Set(["charter", "punsch", "ranger", "sundowner", "cliquentour"]);

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
const FALLBACK_BOAT_NAMES = ["Vechtesonne", "Vechtestromer", "Vechteschute", "Vechteprahm"];
function buildFallbackSlots(slug: string, durationMin: number, capacity: number) {
  const slots: { id: string; startDate: Date; endDate: Date; seatsTotal: number; seatsBooked: number; boatId?: string; boatName?: string }[] = [];
  const times = [11, 14, 17];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const localBooked = readLocalBookings();
  for (let d = 1; d <= 14; d++) {
    for (const h of times) {
      const start = new Date(today);
      start.setDate(start.getDate() + d);
      start.setHours(h, 0, 0, 0);
      const end = new Date(start.getTime() + durationMin * 60_000);
      const id = `fb-${slug}-${d}-${h}`;
      // deterministische "Grund-Belegung" + lokal gespeicherte Reservierungen
      const baseBooked = (d * 3 + h) % Math.max(1, capacity - 4);
      const booked = Math.min(capacity, baseBooked + (localBooked[id] ?? 0));
      const boatName = FALLBACK_BOAT_NAMES[(d + h) % FALLBACK_BOAT_NAMES.length];
      slots.push({
        id,
        startDate: start,
        endDate: end,
        seatsTotal: capacity,
        seatsBooked: booked,
        boatName,
      });
    }
  }
  return slots;
}

// Lokale Persistenz für Fallback-Reservierungen (wenn Backend nicht erreichbar)
const LOCAL_KEY = "vechte.fallbackBookings.v1";
function readLocalBookings(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); } catch { return {}; }
}
function addLocalBooking(slotId: string, qty: number) {
  const cur = readLocalBookings();
  cur[slotId] = (cur[slotId] ?? 0) + qty;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(cur));
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

  // Besondere Touren / Events laufen direkt über den Buchungskalender (Charter-Anfrage)
  useEffect(() => {
    if (SPECIAL_TOUR_SLUGS.has(slug)) {
      navigate(`/charter?type=${slug}`, { replace: true });
    }
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

  // Boote für Anzeige (Name pro Slot)
  const { data: boats = [] } = useQuery({
    queryKey: ["public-boats"],
    queryFn: () => api.listBoats().catch(() => []),
  });
  const boatNameById = new Map(boats.map((b) => [String(b.id), b.name]));

  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const filteredSlots = slots.filter((s) => {
    if (filterFrom) {
      const f = new Date(filterFrom); f.setHours(0, 0, 0, 0);
      if (s.startDate < f) return false;
    }
    if (filterTo) {
      const t = new Date(filterTo); t.setHours(23, 59, 59, 999);
      if (s.startDate > t) return false;
    }
    return true;
  });

  // Pagination: nur die nächsten 6 Termine zeigen, blätterbar
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [filterFrom, filterTo, slots.length]);
  const totalPages = Math.max(1, Math.ceil(filteredSlots.length / PAGE_SIZE));
  const pageSlots = filteredSlots.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [catering, setCatering] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "onsite">("online");
  // Bump zur erzwungenen Neuberechnung der Fallback-Slots nach lokaler Reservierung
  const [, setLocalTick] = useState(0);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const freeSelected = selectedSlot ? selectedSlot.seatsTotal - selectedSlot.seatsBooked : 0;

  const buy = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error("Bitte einen Termin auswählen");
      if (quantity > freeSelected) {
        throw new Error(`Nur noch ${freeSelected} Plätze verfügbar`);
      }
      // Fallback-Pfad: Backend nicht erreichbar – Reservierung lokal persistieren
      if (selectedSlotId.startsWith("fb-")) {
        addLocalBooking(selectedSlotId, quantity);
        return null;
      }
      const booking = await api.buyTickets(selectedSlotId, {
        quantity,
        customer: { name, email, phone },
        catering,
        notes,
        paymentMethod,
      });
      if (paymentMethod === "onsite") return booking;
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
      toast({
        title: paymentMethod === "onsite" ? "Reservierung bestätigt" : "Buchung reserviert",
        description: paymentMethod === "onsite"
          ? "Bitte bezahlen Sie vor Ort beim Bootsführer. Sie erhalten eine Bestätigung per E-Mail."
          : "Sie werden zur Bezahlung weitergeleitet, sofern verfügbar.",
      });
      qc.invalidateQueries({ queryKey: ["public-tours"] });
      setLocalTick((n) => n + 1);
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
        <Card className="mb-4">
          <CardContent className="p-4 grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs">Von</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Bis</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => { setFilterFrom(""); setFilterTo(""); }}>
              Filter zurücksetzen
            </Button>
          </CardContent>
        </Card>
        {filteredSlots.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            Keine Termine im gewählten Zeitraum. Sie können <Link to="/charter" className="text-primary underline">ein Boot privat chartern</Link>.
          </CardContent></Card>
        ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {pageSlots.map((s) => {
              const free = s.seatsTotal - s.seatsBooked;
              const isSelected = s.id === selectedSlotId;
              const sold = free <= 0;
              const slotBoatName = (s as any).boatName || ((s as any).boatId ? boatNameById.get(String((s as any).boatId)) : undefined);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={sold}
                  onClick={() => { setSelectedSlotId(s.id); setQuantity(Math.min(quantity, free)); }}
                  className={`text-left rounded-lg border p-4 transition ${sold ? "opacity-50 cursor-not-allowed border-border" : isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-semibold">{format(s.startDate, "EEEE, d. MMMM yyyy", { locale: de })}</div>
                  <div className="text-sm text-muted-foreground">{format(s.startDate, "HH:mm")} – {format(s.endDate, "HH:mm")} Uhr</div>
                  {slotBoatName && (
                    <div className="text-xs text-muted-foreground mt-1">Boot: <span className="font-medium text-foreground">{slotBoatName}</span></div>
                  )}
                  <div className={`text-sm mt-1 ${sold ? "text-destructive font-medium" : ""}`}>
                    {sold ? "Ausgebucht" : `${free} von ${s.seatsTotal} Plätzen frei`}
                  </div>
                </button>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-8">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Frühere
              </Button>
              <div className="text-sm text-muted-foreground">
                Seite {page + 1} von {totalPages} · {filteredSlots.length} Termine insgesamt
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                Spätere <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
        )}

        {selectedSlotId && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">Tickets buchen</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Anzahl Tickets</Label>
                  <Input
                    type="number"
                    min={1}
                    max={freeSelected}
                    value={quantity}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setQuantity(Math.max(1, Math.min(freeSelected, isNaN(n) ? 1 : n)));
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Noch {freeSelected} {freeSelected === 1 ? "Platz" : "Plätze"} verfügbar</p>
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
              <div className="space-y-2">
                <Label>Bezahlung</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "online" | "onsite")} className="grid sm:grid-cols-2 gap-2">
                  <label className={`flex items-start gap-2 border rounded-lg p-3 cursor-pointer ${paymentMethod === "online" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="online" id="pay-online" className="mt-1" />
                    <div>
                      <div className="font-medium text-sm">Online bezahlen</div>
                      <div className="text-xs text-muted-foreground">Sichere Bezahlung sofort online.</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-2 border rounded-lg p-3 cursor-pointer ${paymentMethod === "onsite" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="onsite" id="pay-onsite" className="mt-1" />
                    <div>
                      <div className="font-medium text-sm">Vor Ort bezahlen</div>
                      <div className="text-xs text-muted-foreground">Reservierung verbindlich – Zahlung beim Bootsführer.</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              <Button
                size="lg"
                onClick={() => buy.mutate()}
                disabled={!name || !email || !phone || quantity < 1 || quantity > freeSelected || buy.isPending}
                className="w-full"
              >
                {buy.isPending
                  ? "Wird gebucht..."
                  : paymentMethod === "onsite"
                    ? `Reservieren (vor Ort € ${total.toFixed(2)} zahlen)`
                    : `Verbindlich buchen (€ ${total.toFixed(2)})`}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {paymentMethod === "onsite"
                  ? "Reservierung ist verbindlich. Bei Nichterscheinen können Gebühren anfallen."
                  : "Sichere Online-Bezahlung. Stornierung gemäß AGB."}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </PublicLayout>
  );
}
