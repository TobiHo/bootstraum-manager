import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, Pencil, X, CalendarRange } from "lucide-react";
import type { PublicTour, TourType, Boat, Captain } from "@/types/booking";

type Props = {
  category: "rundfahrt" | "event";
  title: string;
  description: string;
};

const WEEKDAYS = [
  { v: 1, l: "Mo" }, { v: 2, l: "Di" }, { v: 3, l: "Mi" },
  { v: 4, l: "Do" }, { v: 5, l: "Fr" }, { v: 6, l: "Sa" }, { v: 0, l: "So" },
];

export function PublicTourManager({ category, title, description }: Props) {
  const qc = useQueryClient();
  const { data: tourTypes = [] } = useQuery({ queryKey: ["tour-types"], queryFn: () => api.listTourTypes() });
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });
  const { data: captains = [] } = useQuery({ queryKey: ["captains"], queryFn: () => api.listCaptains() });
  const filtered = useMemo(() => tourTypes.filter((t) => (t.category ?? "rundfahrt") === category), [tourTypes, category]);

  // filters
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fBoat, setFBoat] = useState<string>("all");
  const [fCaptain, setFCaptain] = useState<string>("all");
  const [fTourType, setFTourType] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("scheduled");

  const { data: tours = [], refetch } = useQuery({
    queryKey: ["public-tours-admin", category, from, to, fBoat, fCaptain, fTourType, fStatus],
    queryFn: () => api.listPublicTours({
      category,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      boatId: fBoat !== "all" ? fBoat : undefined,
      captainId: fCaptain !== "all" ? fCaptain : undefined,
      tourTypeId: fTourType !== "all" ? fTourType : undefined,
      status: fStatus !== "all" ? fStatus : undefined,
      includeCancelled: fStatus === "all",
    }),
  });

  // single create
  const [openSingle, setOpenSingle] = useState(false);
  const [singleTT, setSingleTT] = useState("");
  const [singleBoat, setSingleBoat] = useState("");
  const [singleCaptain, setSingleCaptain] = useState<string>("auto");
  const [singleStart, setSingleStart] = useState("");
  const [singleEnd, setSingleEnd] = useState("");
  const [singleSeats, setSingleSeats] = useState(20);

  const createSingle = useMutation({
    mutationFn: () => api.createPublicTour({
      tourTypeId: singleTT, boatId: singleBoat,
      captainId: singleCaptain !== "auto" ? singleCaptain : undefined,
      startDate: new Date(singleStart), endDate: new Date(singleEnd), seatsTotal: singleSeats,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["public-tours-admin"] }); setOpenSingle(false); toast({ title: "Termin angelegt" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // series
  const [openSeries, setOpenSeries] = useState(false);
  const [sTT, setSTT] = useState("");
  const [sBoat, setSBoat] = useState("");
  const [sCap, setSCap] = useState<string>("auto");
  const [sSeats, setSSeats] = useState(20);
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");
  const [sTimes, setSTimes] = useState("10:00, 14:00");
  const [sDuration, setSDuration] = useState(90);
  const [sDays, setSDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  const createSeries = useMutation({
    mutationFn: () => api.createPublicTourSeries({
      tourTypeId: sTT, boatId: sBoat,
      captainId: sCap !== "auto" ? sCap : undefined,
      seatsTotal: sSeats,
      seriesStart: new Date(sStart), seriesEnd: new Date(sEnd),
      weekdays: sDays.length === 7 ? undefined : sDays,
      times: sTimes.split(",").map((t) => t.trim()).filter(Boolean),
      durationMinutes: sDuration,
    }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["public-tours-admin"] });
      setOpenSeries(false);
      toast({ title: `${created.length} Termine erstellt` });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // edit dialog
  const [editing, setEditing] = useState<PublicTour | null>(null);
  const [eBoat, setEBoat] = useState("");
  const [eCap, setECap] = useState<string>("auto");
  const [eStart, setEStart] = useState("");
  const [eEnd, setEEnd] = useState("");
  const [eSeats, setESeats] = useState(20);
  const startEdit = (t: PublicTour) => {
    setEditing(t);
    setEBoat(t.boatId);
    setECap(t.captainId ?? "auto");
    setEStart(format(t.startDate, "yyyy-MM-dd'T'HH:mm"));
    setEEnd(format(t.endDate, "yyyy-MM-dd'T'HH:mm"));
    setESeats(t.seatsTotal);
  };
  const saveEdit = useMutation({
    mutationFn: () => api.updatePublicTour(editing!.id, {
      boatId: eBoat,
      captainId: eCap !== "auto" ? eCap : null,
      startDate: new Date(eStart),
      endDate: new Date(eEnd),
      seatsTotal: eSeats,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["public-tours-admin"] }); setEditing(null); toast({ title: "Aktualisiert" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // cancel dialog
  const [cancelTarget, setCancelTarget] = useState<PublicTour | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const cancelMut = useMutation({
    mutationFn: () => api.cancelPublicTourWithReason(cancelTarget!.id, cancelReason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["public-tours-admin"] }); setCancelTarget(null); setCancelReason(""); toast({ title: "Termin abgesagt" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const captainName = (id?: string) => captains.find((c) => c.id === id)?.name ?? "—";
  const boatName = (id?: string) => boats.find((b) => b.id === id)?.name ?? id ?? "—";
  const tourTypeName = (id: string) => tourTypes.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openSeries} onOpenChange={setOpenSeries}>
            <DialogTrigger asChild><Button variant="outline"><CalendarRange className="h-4 w-4 mr-1" /> Serie anlegen</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Termin-Serie anlegen</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Tour-Typ</Label>
                  <Select value={sTT} onValueChange={setSTT}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>{filtered.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Boot</Label>
                    <Select value={sBoat} onValueChange={setSBoat}>
                      <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                      <SelectContent>{boats.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bootsführer</Label>
                    <Select value={sCap} onValueChange={setSCap}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatisch</SelectItem>
                        {captains.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Von</Label><Input type="date" value={sStart} onChange={(e) => setSStart(e.target.value)} /></div>
                  <div><Label>Bis</Label><Input type="date" value={sEnd} onChange={(e) => setSEnd(e.target.value)} /></div>
                </div>
                <div>
                  <Label>Wochentage</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {WEEKDAYS.map((d) => {
                      const on = sDays.includes(d.v);
                      return (
                        <Button key={d.v} type="button" size="sm" variant={on ? "default" : "outline"}
                          onClick={() => setSDays(on ? sDays.filter((x) => x !== d.v) : [...sDays, d.v])}>
                          {d.l}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Uhrzeiten (kommagetrennt)</Label><Input value={sTimes} onChange={(e) => setSTimes(e.target.value)} placeholder="10:00, 14:00" /></div>
                  <div><Label>Dauer (Min.)</Label><Input type="number" value={sDuration} onChange={(e) => setSDuration(Number(e.target.value))} /></div>
                </div>
                <div><Label>Plätze pro Termin</Label><Input type="number" value={sSeats} onChange={(e) => setSSeats(Number(e.target.value))} /></div>
                <Button onClick={() => createSeries.mutate()} disabled={!sTT || !sBoat || !sStart || !sEnd || createSeries.isPending} className="w-full">
                  {createSeries.isPending ? "Erstelle…" : "Serie erstellen"}
                </Button>
                <p className="text-xs text-muted-foreground">Bestehende Termine zur selben Zeit auf demselben Boot werden übersprungen.</p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openSingle} onOpenChange={setOpenSingle}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Neuer Termin</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neuen Termin anlegen</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Tour-Typ</Label>
                  <Select value={singleTT} onValueChange={setSingleTT}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>{filtered.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Boot</Label>
                    <Select value={singleBoat} onValueChange={setSingleBoat}>
                      <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                      <SelectContent>{boats.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} (max. {b.capacity})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bootsführer</Label>
                    <Select value={singleCaptain} onValueChange={setSingleCaptain}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatisch</SelectItem>
                        {captains.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start</Label><Input type="datetime-local" value={singleStart} onChange={(e) => setSingleStart(e.target.value)} /></div>
                  <div><Label>Ende</Label><Input type="datetime-local" value={singleEnd} onChange={(e) => setSingleEnd(e.target.value)} /></div>
                </div>
                <div><Label>Plätze</Label><Input type="number" value={singleSeats} onChange={(e) => setSingleSeats(Number(e.target.value))} /></div>
                <Button onClick={() => createSingle.mutate()} className="w-full" disabled={!singleTT || !singleBoat || !singleStart || !singleEnd}>Speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div><Label className="text-xs">Von</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">Bis</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div>
            <Label className="text-xs">Boot</Label>
            <Select value={fBoat} onValueChange={setFBoat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {boats.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Bootsführer</Label>
            <Select value={fCaptain} onValueChange={setFCaptain}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {captains.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tour-Typ</Label>
            <Select value={fTourType} onValueChange={setFTourType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {filtered.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Geplant</SelectItem>
                <SelectItem value="cancelled">Abgesagt</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="all">Alle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {tours.map((t) => {
          const cancelled = t.status === "cancelled";
          return (
            <Card key={t.id} className={cancelled ? "border-destructive/40" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold flex items-center gap-2">
                    {tourTypeName(t.tourTypeId)}
                    {cancelled && <Badge variant="destructive">Abgesagt{t.cancellationReason ? `: ${t.cancellationReason}` : ""}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(t.startDate, "EEE, d. MMM yyyy HH:mm", { locale: de })} – {format(t.endDate, "HH:mm")}
                    {" · "}Boot: <strong>{boatName(t.boatId)}</strong>
                    {" · "}Bootsführer: <strong>{captainName(t.captainId)}</strong>
                  </div>
                  <div className="text-sm">{t.seatsBooked} / {t.seatsTotal} Plätze gebucht</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(t)} title="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                  {!cancelled && (
                    <Button size="icon" variant="ghost" onClick={() => setCancelTarget(t)} title="Absagen"><X className="h-4 w-4" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {tours.length === 0 && <p className="text-muted-foreground">Keine Termine im aktuellen Filter.</p>}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Termin bearbeiten</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Boot</Label>
                  <Select value={eBoat} onValueChange={setEBoat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{boats.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bootsführer</Label>
                  <Select value={eCap} onValueChange={setECap}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">— Keiner —</SelectItem>
                      {captains.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start</Label><Input type="datetime-local" value={eStart} onChange={(e) => setEStart(e.target.value)} /></div>
                <div><Label>Ende</Label><Input type="datetime-local" value={eEnd} onChange={(e) => setEEnd(e.target.value)} /></div>
              </div>
              <div><Label>Plätze</Label><Input type="number" value={eSeats} onChange={(e) => setESeats(Number(e.target.value))} /></div>
              <Button onClick={() => saveEdit.mutate()} className="w-full" disabled={saveEdit.isPending}>Speichern</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Termin absagen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Bitte gib eine Begründung an. Diese wird bei abgesagten Terminen angezeigt.</p>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="z. B. schlechtes Wetter, technischer Defekt …" />
            <Button onClick={() => cancelMut.mutate()} disabled={!cancelReason.trim() || cancelMut.isPending} variant="destructive" className="w-full">
              Termin absagen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
