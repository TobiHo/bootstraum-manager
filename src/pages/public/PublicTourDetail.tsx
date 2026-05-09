import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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

export default function PublicTourDetail() {
  const { slug = "" } = useParams();
  const qc = useQueryClient();

  const { data: tt } = useQuery({
    queryKey: ["tour-type", slug],
    queryFn: () => api.getTourTypeBySlug(slug),
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["public-tours", tt?.id],
    queryFn: () => api.listPublicTours({ tourTypeId: tt!.id, from: new Date(), onlyAvailable: true }),
    enabled: !!tt,
  });

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
        const { checkout_url } = await api.createPaddleCheckout(booking.id);
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

  if (!tt) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-16">Lade Tour...</div>
      </PublicLayout>
    );
  }

  const total = quantity * tt.pricePerTicket;

  return (
    <PublicLayout>
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
                Sichere Online-Bezahlung über Paddle. Stornierung gemäß AGB.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </PublicLayout>
  );
}
