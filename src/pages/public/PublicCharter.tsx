import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import charterImg from "@/assets/charter.jpg";

export default function PublicCharter() {
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });

  const [boatId, setBoatId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [participants, setParticipants] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [catering, setCatering] = useState(false);
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const booking = await api.createPublicCharter({
        boatId,
        startDate: new Date(start),
        endDate: new Date(end),
        participants,
        customer: { name, email, phone },
        catering,
        notes,
      });
      try {
        const { checkout_url } = await api.createStripeCheckout(booking.id);
        window.location.href = checkout_url;
      } catch {
        // Online payment optional – booking stays pending for manual confirmation
      }
      return booking;
    },
    onSuccess: () => {
      toast({ title: "Anfrage übermittelt", description: "Sie werden ggf. zur Bezahlung weitergeleitet." });
      setBoatId(""); setStart(""); setEnd(""); setParticipants(2);
      setName(""); setEmail(""); setPhone(""); setNotes(""); setCatering(false);
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const eligibleBoats = boats.filter((b) => b.available && b.capacity >= participants);

  return (
    <PublicLayout>
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={charterImg} alt="Privates Charterboot" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 h-full flex items-end pb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow">Privates Boot chartern</h1>
        </div>
      </div>
      <section className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-muted-foreground mb-8">Mieten Sie ein komplettes Boot exklusiv für Ihre Gruppe.</p>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Start *</Label><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div><Label>Ende *</Label><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Personenanzahl *</Label>
                <Input type="number" min={1} value={participants} onChange={(e) => setParticipants(Number(e.target.value))} />
              </div>
              <div>
                <Label>Boot wählen *</Label>
                <Select value={boatId} onValueChange={setBoatId}>
                  <SelectTrigger><SelectValue placeholder="Boot auswählen" /></SelectTrigger>
                  <SelectContent>
                    {eligibleBoats.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name} (max. {b.capacity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              className="w-full"
              disabled={!boatId || !start || !end || !name || !email || !phone || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Wird übermittelt..." : "Anfrage senden"}
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
