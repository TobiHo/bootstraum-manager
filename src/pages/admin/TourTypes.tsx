import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { TourType } from "@/types/booking";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const empty: Omit<TourType, "id"> = {
  slug: "",
  name: "",
  description: "",
  durationMinutes: 60,
  pricePerTicket: 10,
  minParticipants: 1,
  maxParticipants: 25,
  imageUrl: "",
  active: true,
};

export default function AdminTourTypes() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ["tour-types"], queryFn: () => api.listTourTypes() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TourType | null>(null);
  const [form, setForm] = useState<Omit<TourType, "id">>(empty);

  const startCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (t: TourType) => { setEditing(t); const { id, ...rest } = t; setForm(rest); setOpen(true); };

  const save = useMutation({
    mutationFn: () => editing ? api.updateTourType(editing.id, form) : api.createTourType(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tour-types"] }); setOpen(false); toast({ title: "Gespeichert" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteTourType(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tour-types"] }); toast({ title: "Gelöscht" }); },
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tour-Typen (Stammdaten)</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> Neue Tour</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Tour bearbeiten" : "Neue Tour"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
                <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Dauer (Min.)</Label><Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></div>
                  <div><Label>Preis pro Ticket (€)</Label><Input type="number" step="0.01" value={form.pricePerTicket} onChange={(e) => setForm({ ...form, pricePerTicket: Number(e.target.value) })} /></div>
                  <div><Label>Min. Teilnehmer</Label><Input type="number" value={form.minParticipants} onChange={(e) => setForm({ ...form, minParticipants: Number(e.target.value) })} /></div>
                  <div><Label>Max. Teilnehmer</Label><Input type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })} /></div>
                </div>
                <div><Label>Bild-URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Aktiv (im Webshop sichtbar)</Label></div>
                <Button onClick={() => save.mutate()} className="w-full">Speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((t) => (
            <Card key={t.id}><CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <div><h3 className="font-semibold">{t.name}</h3><p className="text-xs text-muted-foreground">/{t.slug}</p></div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{t.description}</p>
              <div className="text-sm flex gap-4">
                <span>{t.durationMinutes} Min.</span>
                <span className="font-bold text-primary">€ {t.pricePerTicket.toFixed(2)}</span>
                <span>{t.active ? "✓ aktiv" : "○ inaktiv"}</span>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
