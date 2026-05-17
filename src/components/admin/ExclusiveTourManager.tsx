import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export function ExclusiveTourManager() {
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: () => api.listBookings() });
  const { data: tourTypes = [] } = useQuery({ queryKey: ["tour-types"], queryFn: () => api.listTourTypes() });
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });
  const { data: captains = [] } = useQuery({ queryKey: ["captains"], queryFn: () => api.listCaptains() });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fTourType, setFTourType] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");

  const boatName = (id: string) => boats.find((b) => b.id === id)?.name ?? "—";
  const captainName = (id: string) => captains.find((c) => c.id === id)?.name ?? "—";
  const paymentLabel = (s?: string) => {
    switch (s) {
      case "paid": return <Badge variant="default">Bezahlt</Badge>;
      case "pay_on_site": return <Badge variant="secondary">Vor Ort</Badge>;
      case "refunded": return <Badge variant="outline">Erstattet</Badge>;
      default: return <Badge variant="destructive">Offen</Badge>;
    }
  };

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => (b.bookingKind ?? "charter") === "charter")
      .filter((b) => {
        if (from) {
          const f = new Date(from); f.setHours(0,0,0,0);
          if (b.startDate < f) return false;
        }
        if (to) {
          const t = new Date(to); t.setHours(23,59,59,999);
          if (b.startDate > t) return false;
        }
        if (fStatus !== "all" && b.status !== fStatus) return false;
        if (fTourType !== "all") {
          const tt = tourTypes.find((t) => t.id === fTourType);
          const ttName = tt?.name?.toLowerCase() ?? "";
          const bType = (b.tourType ?? "").toLowerCase();
          if (!ttName || !bType.includes(ttName.split(" ")[0])) return false;
        }
        return true;
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [bookings, tourTypes, from, to, fStatus, fTourType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exklusivtouren</h1>
        <p className="text-muted-foreground text-sm">
          Charter-Buchungen – ganze Boote, exklusiv für Gruppen. Filter nach Tour-Typ (Punsch, Sundowner, Rundfahrt …).
        </p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><Label className="text-xs">Von</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">Bis</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div>
            <Label className="text-xs">Tour-Typ</Label>
            <Select value={fTourType} onValueChange={setFTourType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {tourTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{filtered.length} Charter-Buchungen</CardTitle></CardHeader>
        <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 && <p className="text-muted-foreground">Keine Charter-Buchungen im Filter.</p>}
          {filtered.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
              <div className="min-w-0">
                <div className="font-semibold flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{b.tourType ?? "Charter"}</Badge>
                  {b.customer.name}
                  {paymentLabel(b.paymentStatus)}
                  {b.status === "cancelled" && <Badge variant="destructive">Storniert</Badge>}
                  {b.status === "pending" && <Badge variant="outline">Ausstehend</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(b.startDate, "EEE, d. MMM yyyy HH:mm", { locale: de })} – {format(b.endDate, "HH:mm")}
                  {" · "}Boot: <strong>{boatName(b.boatId)}</strong>
                  {" · "}Bootsführer: <strong>{captainName(b.captainId)}</strong>
                  {" · "}{b.participants} P.
                  {typeof b.totalPrice === "number" && b.totalPrice > 0 && <> · <strong>{b.totalPrice.toFixed(2)} €</strong></>}
                </div>
                <div className="text-xs text-muted-foreground">{b.customer.email} · {b.customer.phone}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}