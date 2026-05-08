import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const reasonLabel: Record<string, string> = {
  vacation: "Urlaub",
  sick: "Krankheit",
  permanent: "Dauerhaft nicht verfügbar",
  other: "Sonstiges",
};

export default function MyAbsences() {
  const qc = useQueryClient();
  const { data: absences = [], isError } = useQuery({ queryKey: ["my-absences"], queryFn: () => api.listMyAbsences() });

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState<"vacation" | "sick" | "permanent" | "other">("vacation");
  const [notes, setNotes] = useState("");

  const add = useMutation({
    mutationFn: () => api.createMyAbsence({ startDate: new Date(start), endDate: new Date(end), reason, notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-absences"] }); setStart(""); setEnd(""); setNotes(""); toast({ title: "Eingetragen" }); },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteMyAbsence(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-absences"] }),
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Meine Abwesenheiten</h1>

        {isError && (
          <Card className="mb-4"><CardContent className="p-4 text-sm text-destructive">
            Ihr Benutzerkonto ist noch keinem Bootsführer-Profil zugeordnet. Bitte einen Admin um Verknüpfung.
          </CardContent></Card>
        )}

        <Card className="mb-6"><CardContent className="p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Neuen Zeitraum eintragen</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Von</Label><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label>Bis</Label><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div>
            <Label>Grund</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(reasonLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notiz</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button onClick={() => add.mutate()} disabled={!start || !end}>Speichern</Button>
        </CardContent></Card>

        <div className="space-y-2">
          {absences.map((a) => (
            <Card key={a.id}><CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{format(a.startDate, "d. MMM yyyy HH:mm", { locale: de })} – {format(a.endDate, "d. MMM yyyy HH:mm", { locale: de })}</div>
                <div className="text-sm text-muted-foreground">{reasonLabel[a.reason]}{a.notes ? ` · ${a.notes}` : ""}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent></Card>
          ))}
          {absences.length === 0 && !isError && <p className="text-muted-foreground">Keine Einträge.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
