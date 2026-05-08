import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export default function AdminPublicTours() {
  const qc = useQueryClient();
  const { data: tourTypes = [] } = useQuery({ queryKey: ["tour-types"], queryFn: () => api.listTourTypes() });
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });
  const { data: tours = [] } = useQuery({ queryKey: ["public-tours"], queryFn: () => api.listPublicTours({}) });

  const [open, setOpen] = useState(false);
  const [tourTypeId, setTourTypeId] = useState("");
  const [boatId, setBoatId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [seats, setSeats] = useState(20);

  const create = useMutation({
    mutationFn: () => api.createPublicTour({
      tourTypeId, boatId, startDate: new Date(start), endDate: new Date(end), seatsTotal: seats,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["public-tours"] }); setOpen(false); toast({ title: "Slot angelegt – Bootsführer automatisch zugeordnet" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.cancelPublicTour(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["public-tours"] }),
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Öffentliche Tour-Termine</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Neuer Termin</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neuen Termin anlegen</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Tour-Typ</Label>
                  <Select value={tourTypeId} onValueChange={setTourTypeId}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>{tourTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Boot</Label>
                  <Select value={boatId} onValueChange={setBoatId}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>{boats.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} (max. {b.capacity})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start</Label><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
                  <div><Label>Ende</Label><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
                </div>
                <div><Label>Plätze</Label><Input type="number" value={seats} onChange={(e) => setSeats(Number(e.target.value))} /></div>
                <Button onClick={() => create.mutate()} className="w-full" disabled={!tourTypeId || !boatId || !start || !end}>Speichern</Button>
                <p className="text-xs text-muted-foreground">Ein verfügbarer Bootsführer wird automatisch zugeordnet.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {tours.map((t) => {
            const tt = tourTypes.find((x) => x.id === t.tourTypeId);
            const boat = boats.find((b) => b.id === t.boatId);
            return (
              <Card key={t.id}><CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{tt?.name || `Tour ${t.tourTypeId}`}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(t.startDate, "EEE, d. MMM yyyy HH:mm", { locale: de })} – {format(t.endDate, "HH:mm")} · Boot: {boat?.name || t.boatId} · Bootsführer-ID: {t.captainId || "—"}
                  </div>
                  <div className="text-sm">{t.seatsBooked} / {t.seatsTotal} Plätze gebucht · Status: {t.status}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => cancel.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent></Card>
            );
          })}
          {tours.length === 0 && <p className="text-muted-foreground">Noch keine Termine.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
