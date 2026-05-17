import { useState } from "react";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import charterImg from "@/assets/vvv/ganzer-tag.jpg";

// Fallback-Boote (wenn Backend nicht erreichbar)
const FALLBACK_BOATS = [
  { id: "fb-boat-large", name: "Vechtesonne (groß)", capacity: 25, available: true },
  { id: "fb-boat-small", name: "Vechteprahm (klein)", capacity: 12, available: true },
];

// Lokale Persistenz für Charter-Reservierungen (gegen Doppelbuchungen)
const CHARTER_KEY = "vechte.fallbackCharters.v1";
type LocalCharter = { boatId: string; start: string; end: string };
function readLocalCharters(): LocalCharter[] {
  try { return JSON.parse(localStorage.getItem(CHARTER_KEY) || "[]"); } catch { return []; }
}
function addLocalCharter(c: LocalCharter) {
  const cur = readLocalCharters();
  cur.push(c);
  localStorage.setItem(CHARTER_KEY, JSON.stringify(cur));
}
function hasConflict(boatId: string, start: Date, end: Date): boolean {
  return readLocalCharters().some((c) => {
    if (c.boatId !== boatId) return false;
    const cs = new Date(c.start).getTime();
    const ce = new Date(c.end).getTime();
    return cs < end.getTime() && ce > start.getTime();
  });
}

const TOUR_LABELS: Record<string, { title: string; intro: string }> = {
  charter:     { title: "Privates Boot chartern",        intro: "Mieten Sie ein komplettes Boot exklusiv für Ihre Gruppe." },
  punsch:      { title: "Punschfahrt exklusiv buchen",   intro: "Heißer Punsch, warme Decken – ganzes Boot exklusiv für Ihre Gruppe." },
  ranger:      { title: "Vechte-Ranger exklusiv buchen", intro: "Die Abenteuer-Tour für Ihre Kindergruppe oder Familie – ganzes Boot exklusiv." },
  sundowner:   { title: "Sundowner exklusiv buchen",     intro: "Sonnenuntergang vom Wasser aus – ganzes Boot exklusiv für Ihre Gruppe." },
  cliquentour: { title: "Cliquentour exklusiv buchen",   intro: "Feiern mit Freunden auf der Vechte – ganzes Boot exklusiv für Ihre Clique." },
};

export default function PublicCharter() {
  const [params] = useSearchParams();
  const type = params.get("type") || "charter";
  const meta = TOUR_LABELS[type] || TOUR_LABELS.charter;
  const { data: apiBoats = [] } = useQuery({
    queryKey: ["boats"],
    queryFn: () => api.listBoats().catch(() => [] as Awaited<ReturnType<typeof api.listBoats>>),
  });
  const boats = apiBoats.length > 0 ? apiBoats : FALLBACK_BOATS;

  // Tour-Typ (für Dauer-Default bei Events wie Punsch/Sundowner/Cliquen/Ranger)
  const { data: tourTypes = [] } = useQuery({
    queryKey: ["tour-types-public"],
    queryFn: () => api.listTourTypes(true).catch(() => []),
  });
  const matchedTourType = useMemo(
    () => tourTypes.find((t) => t.slug === type || t.slug.startsWith(type)),
    [tourTypes, type]
  );
  const defaultDurationMin = matchedTourType?.durationMinutes ?? (type === "charter" ? 120 : 90);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("14:00");
  const [participants, setParticipants] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [catering, setCatering] = useState(false);
  const [notes, setNotes] = useState(type !== "charter" ? `Tour-Wunsch: ${meta.title}` : "");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "onsite">("online");

  // Datum + Uhrzeit -> start
  useEffect(() => {
    if (!selectedDate || !selectedTime) { setStart(""); return; }
    const [hh, mm] = selectedTime.split(":").map(Number);
    const d = new Date(selectedDate);
    d.setHours(hh || 0, mm || 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    setStart(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, [selectedDate, selectedTime]);

  // Endzeit automatisch aus Startzeit + Tour-Dauer berechnen
  useEffect(() => {
    if (!start) { setEnd(""); return; }
    const s = new Date(start);
    if (isNaN(s.getTime())) return;
    const e = new Date(s.getTime() + defaultDurationMin * 60_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEnd(`${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}T${pad(e.getHours())}:${pad(e.getMinutes())}`);
  }, [start, defaultDurationMin]);

  // Boot automatisch nach Personenanzahl wählen: kleinstes verfügbares Boot mit ausreichender Kapazität
  const autoBoat = useMemo(() => {
    const candidates = boats
      .filter((b) => b.available && b.capacity >= participants)
      .sort((a, b) => a.capacity - b.capacity);
    return candidates[0];
  }, [boats, participants]);
  const boatId = autoBoat?.id ?? "";

  const create = useMutation({
    mutationFn: async () => {
      if (!boatId) throw new Error("Kein passendes Boot für die gewählte Personenanzahl verfügbar.");
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (endDate <= startDate) throw new Error("Endzeit muss nach Startzeit liegen.");
      // Konsistenzprüfung: Boot zur gewählten Zeit verfügbar?
      if (boatId.startsWith("fb-") || apiBoats.length === 0) {
        if (hasConflict(boatId, startDate, endDate)) {
          throw new Error("Dieses Boot ist im gewählten Zeitraum bereits reserviert.");
        }
      }
      // Fallback-Modus: keine Backend-Buchung möglich, lokal speichern
      if (boatId.startsWith("fb-")) {
        addLocalCharter({ boatId, start: startDate.toISOString(), end: endDate.toISOString() });
        return { id: `fb-${Date.now()}` } as any;
      }
      const booking = await api.createPublicCharter({
        boatId,
        startDate,
        endDate,
        participants,
        customer: { name, email, phone },
        catering,
        notes,
        tourType: type !== "charter" ? meta.title : undefined,
        tourTypeSlug: type !== "charter" ? type : undefined,
        paymentMethod,
      });
      if (paymentMethod === "onsite") return booking;
      try {
        const { checkout_url } = await api.createStripeCheckout(booking.id);
        window.location.href = checkout_url;
      } catch {
        // Online payment optional – booking stays pending for manual confirmation
      }
      return booking;
    },
    onSuccess: () => {
      toast({
        title: paymentMethod === "onsite" ? "Reservierung bestätigt" : "Anfrage übermittelt",
        description: paymentMethod === "onsite"
          ? "Zahlung erfolgt vor Ort. Wir bestätigen den Termin per E-Mail."
          : "Sie werden ggf. zur Bezahlung weitergeleitet.",
      });
      setStart(""); setEnd(""); setParticipants(2);
      setSelectedDate(undefined); setSelectedTime("14:00");
      setName(""); setEmail(""); setPhone(""); setNotes(""); setCatering(false);
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return (
    <PublicLayout>
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={charterImg} alt="Privates Charterboot" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 h-full flex items-end pb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow">{meta.title}</h1>
        </div>
      </div>
      <section className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-muted-foreground mb-8">{meta.intro}</p>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Verfügbarer Tag *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "EEEE, d. MMMM yyyy", { locale: de })
                        : <span className="text-muted-foreground">Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      weekStartsOn={1}
                      locale={de}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Uhrzeit *</Label>
                <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">
                  Dauer: {defaultDurationMin} Min.{end ? ` (Ende ca. ${end.slice(11, 16)})` : ""}
                </p>
              </div>
            </div>
            <div>
              <Label>Personenanzahl *</Label>
              <Input type="number" min={1} value={participants} onChange={(e) => setParticipants(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">
                {autoBoat
                  ? <>Wir ordnen automatisch ein passendes Boot zu: <span className="font-medium text-foreground">{autoBoat.name}</span> (max. {autoBoat.capacity} Personen)</>
                  : <span className="text-destructive">Aktuell ist kein Boot mit ausreichender Kapazität verfügbar.</span>
                }
              </p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              <div className="font-semibold text-foreground mb-1">Exklusivfahrt – ganzes Boot</div>
              <p className="text-muted-foreground">
                Diese Fahrt ist ausschließlich für Ihre Gruppe reserviert. Der Endpreis wird nach
                Bestätigung der Buchung berechnet (Boots-Charter pro Stunde, inkl. Bootsführer).
                Möchten Sie stattdessen ein Einzelticket für eine öffentliche Tour, schauen Sie unter{" "}
                <a href="/touren" className="text-primary underline">Öffentliche Touren</a> nach freien Terminen.
              </p>
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
                  <RadioGroupItem value="online" id="pm-online" className="mt-1" />
                  <div>
                    <div className="font-medium text-sm">Online bezahlen</div>
                    <div className="text-xs text-muted-foreground">Sofortige sichere Bezahlung.</div>
                  </div>
                </label>
                <label className={`flex items-start gap-2 border rounded-lg p-3 cursor-pointer ${paymentMethod === "onsite" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="onsite" id="pm-onsite" className="mt-1" />
                  <div>
                    <div className="font-medium text-sm">Vor Ort bezahlen</div>
                    <div className="text-xs text-muted-foreground">Verbindliche Reservierung, Zahlung beim Bootsführer.</div>
                  </div>
                </label>
              </RadioGroup>
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!boatId || !start || !end || !name || !email || !phone || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending
                ? "Wird übermittelt..."
                : paymentMethod === "onsite" ? "Verbindlich reservieren" : "Anfrage senden"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Wir bestätigen Ihre Buchung innerhalb eines Werktages und ordnen automatisch einen freien Bootsführer zu.
            </p>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
