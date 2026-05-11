import { AppLayout } from "@/components/layout/AppLayout";
import { PublicTourManager } from "@/components/admin/PublicTourManager";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function AdminPublicEvents() {
  const { data: tourTypes = [] } = useQuery({ queryKey: ["tour-types"], queryFn: () => api.listTourTypes() });
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: () => api.listBookings() });
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });
  const { data: captains = [] } = useQuery({ queryKey: ["captains"], queryFn: () => api.listCaptains() });

  const eventTourTypeNames = new Set(
    tourTypes.filter((t) => (t.category ?? "rundfahrt") === "event").map((t) => t.name.toLowerCase())
  );
  const eventBookings = bookings
    .filter((b) => b.tourType && eventTourTypeNames.has(b.tourType.toLowerCase()))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const boatName = (id: string) => boats.find((x) => x.id === id)?.name ?? "—";
  const captainName = (id: string) => captains.find((x) => x.id === id)?.name ?? "—";
  const paymentLabel = (s?: string) => {
    switch (s) {
      case "paid": return <Badge variant="default">Bezahlt</Badge>;
      case "pay_on_site": return <Badge variant="secondary">Vor Ort</Badge>;
      case "refunded": return <Badge variant="outline">Erstattet</Badge>;
      default: return <Badge variant="destructive">Offen</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PublicTourManager
          category="event"
          title="Events & Sondertouren"
          description="Themen-, Sundowner-, Punsch- und Cliquentouren — saisonale und besondere Events."
        />

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Event-Buchungen ({eventBookings.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Alle Event-Buchungen — sowohl Online-Tickets aus dem Shop (Cliquentour, Punsch, Sundowner …) als auch Charter- bzw. Kalender-Buchungen.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {eventBookings.length === 0 && (
              <p className="text-muted-foreground">Keine Event-Buchungen vorhanden.</p>
            )}
            {eventBookings.map((b) => {
              const isShop = b.bookingKind === "public";
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-2 flex-wrap">
                      <Badge variant={isShop ? "default" : "secondary"}>{isShop ? "Shop-Ticket" : "Charter"}</Badge>
                      {b.tourType} · {b.customer.name}
                      {paymentLabel(b.paymentStatus)}
                      {b.status === "cancelled" && <Badge variant="destructive">Storniert</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(b.startDate, "EEE, d. MMM yyyy HH:mm", { locale: de })} – {format(b.endDate, "HH:mm")}
                      {" · "}Boot: <strong>{boatName(b.boatId)}</strong>
                      {" · "}Bootsführer: <strong>{captainName(b.captainId)}</strong>
                      {" · "}{b.participants} P.
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
