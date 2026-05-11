import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#0fb5ba", "#0055CC", "#FF6B35", "#FFA502", "#2ECC71", "#9b59b6", "#e74c3c"];

type Filters = {
  from?: string; to?: string;
  boatId?: string; captainId?: string;
  tourTypeId?: string; paymentMethod?: string;
};

function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });
  const { data: captains = [] } = useQuery({ queryKey: ["captains"], queryFn: () => api.listCaptains() });
  const { data: tts = [] } = useQuery({ queryKey: ["tour-types"], queryFn: () => api.listTourTypes() });
  const set = (k: keyof Filters, v: string | undefined) => onChange({ ...value, [k]: v === "all" ? undefined : v });
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <div><Label className="text-xs">Von</Label><Input type="date" value={value.from ?? ""} onChange={(e) => set("from", e.target.value || undefined)} /></div>
        <div><Label className="text-xs">Bis</Label><Input type="date" value={value.to ?? ""} onChange={(e) => set("to", e.target.value || undefined)} /></div>
        <div>
          <Label className="text-xs">Boot</Label>
          <Select value={value.boatId ?? "all"} onValueChange={(v) => set("boatId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Alle</SelectItem>{boats.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Bootsführer</Label>
          <Select value={value.captainId ?? "all"} onValueChange={(v) => set("captainId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Alle</SelectItem>{captains.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tour-Typ</Label>
          <Select value={value.tourTypeId ?? "all"} onValueChange={(v) => set("tourTypeId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Alle</SelectItem>{tts.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Zahlungsart</Label>
          <Select value={value.paymentMethod ?? "all"} onValueChange={(v) => set("paymentMethod", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="onsite">Vor Ort</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function toApiParams(f: Filters) {
  return {
    from: f.from ? new Date(f.from) : undefined,
    to: f.to ? new Date(f.to) : undefined,
    boatId: f.boatId,
    captainId: f.captainId,
    tourTypeId: f.tourTypeId,
    paymentMethod: f.paymentMethod,
  };
}

function FinanceTab({ filters }: { filters: Filters }) {
  const { data } = useQuery({ queryKey: ["report-finance", filters], queryFn: () => api.report("finance", toApiParams(filters)) });
  if (!data) return <p className="text-muted-foreground">Lädt…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Gesamt-Umsatz</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{formatPrice(data.total_revenue)}</div><p className="text-xs text-muted-foreground">{data.booking_count} Buchungen</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Bezahlt</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatPrice(data.by_payment.paid)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Vor Ort</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatPrice(data.by_payment.onsite)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Offen</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatPrice(data.by_payment.unpaid)}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Umsatz nach Monat</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.by_month}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v: number) => formatPrice(v)} />
              <Line dataKey="revenue" stroke="#0fb5ba" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
      <Card><CardHeader><CardTitle>Umsatz nach Buchungsart</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.by_kind}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="kind" /><YAxis /><Tooltip formatter={(v: number) => formatPrice(v)} />
              <Bar dataKey="revenue">{data.by_kind.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
    </div>
  );
}

function ToursTab({ filters }: { filters: Filters }) {
  const { data } = useQuery({ queryKey: ["report-tours", filters], queryFn: () => api.report("tours", toApiParams(filters)) });
  if (!data) return <p className="text-muted-foreground">Lädt…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Geplante Termine</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.public_tours_total}</div><p className="text-xs text-muted-foreground">{data.public_tours_cancelled} abgesagt</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Plätze gesamt</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.seats_total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Plätze gebucht</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.seats_booked}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sitz-Auslastung</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{data.seat_utilization_pct}%</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Umsatz nach Tour-Typ</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_type}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v: number) => formatPrice(v)} />
              <Bar dataKey="revenue">{data.by_type.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      <Card><CardHeader><CardTitle>Top-Touren</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Tour</TableHead><TableHead>Buchungen</TableHead><TableHead>Tickets</TableHead><TableHead>Umsatz</TableHead></TableRow></TableHeader>
            <TableBody>{data.by_type.map((r: any) => (
              <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell>{r.bookings}</TableCell><TableCell>{r.tickets}</TableCell><TableCell>{formatPrice(r.revenue)}</TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
    </div>
  );
}

function CaptainsTab({ filters }: { filters: Filters }) {
  const { data } = useQuery({ queryKey: ["report-captains", filters], queryFn: () => api.report("captains", toApiParams(filters)) });
  if (!data) return <p className="text-muted-foreground">Lädt…</p>;
  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Einsätze pro Bootsführer</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.rows.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={80} /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="bookings" stackId="a" fill="#0055CC" name="Charter" />
              <Bar dataKey="public_tours" stackId="a" fill="#0fb5ba" name="Öffentliche Touren" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      <Card><CardHeader><CardTitle>Detailauswertung</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Bootsführer</TableHead><TableHead>Charter</TableHead><TableHead>Öff. Touren</TableHead><TableHead>Stunden</TableHead><TableHead>Abwesenheiten</TableHead></TableRow></TableHeader>
            <TableBody>{data.rows.map((r: any) => (
              <TableRow key={r.captain_id}><TableCell>{r.name}</TableCell><TableCell>{r.bookings}</TableCell><TableCell>{r.public_tours}</TableCell><TableCell>{r.hours.toFixed(1)} h</TableCell><TableCell>{r.absences}</TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
    </div>
  );
}

function BoatsTab({ filters }: { filters: Filters }) {
  const { data } = useQuery({ queryKey: ["report-boats", filters], queryFn: () => api.report("boats", toApiParams(filters)) });
  if (!data) return <p className="text-muted-foreground">Lädt…</p>;
  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Sitz-Auslastung pro Boot</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.rows}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis unit="%" /><Tooltip />
              <Bar dataKey="seat_utilization_pct" name="Auslastung %">{data.rows.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      <Card><CardHeader><CardTitle>Detailauswertung</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Boot</TableHead><TableHead>Kapazität</TableHead><TableHead>Charter</TableHead><TableHead>Öff. Touren</TableHead><TableHead>Plätze gebucht</TableHead><TableHead>Auslastung</TableHead><TableHead>Stunden</TableHead></TableRow></TableHeader>
            <TableBody>{data.rows.map((r: any) => (
              <TableRow key={r.boat_id}><TableCell>{r.name}</TableCell><TableCell>{r.capacity}</TableCell><TableCell>{r.bookings}</TableCell><TableCell>{r.public_tours_active}</TableCell><TableCell>{r.seats_booked}/{r.seats_total}</TableCell><TableCell>{r.seat_utilization_pct}%</TableCell><TableCell>{r.hours.toFixed(1)} h</TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
    </div>
  );
}

function CustomersTab({ filters }: { filters: Filters }) {
  const { data } = useQuery({ queryKey: ["report-customers", filters], queryFn: () => api.report("customers", toApiParams(filters)) });
  if (!data) return <p className="text-muted-foreground">Lädt…</p>;
  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Top-Kunden ({data.total_customers} insgesamt)</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>E-Mail</TableHead><TableHead>Buchungen</TableHead><TableHead>Umsatz</TableHead></TableRow></TableHeader>
            <TableBody>{data.rows.map((r: any) => (
              <TableRow key={r.email}><TableCell>{r.name}</TableCell><TableCell className="text-muted-foreground text-xs">{r.email}</TableCell><TableCell>{r.bookings}</TableCell><TableCell>{formatPrice(r.revenue)}</TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
    </div>
  );
}

function ScheduleList({ kind, filters }: { kind: "captain-schedule" | "boat-schedule"; filters: Filters }) {
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });
  const { data: captains = [] } = useQuery({ queryKey: ["captains"], queryFn: () => api.listCaptains() });
  const { data } = useQuery({ queryKey: [`report-${kind}`, filters], queryFn: () => api.report(kind, toApiParams(filters)) });
  const boatName = (id: number | string | null | undefined) => boats.find((b) => String(b.id) === String(id))?.name ?? "—";
  const captainName = (id: number | string | null | undefined) => captains.find((c) => String(c.id) === String(id))?.name ?? "—";
  if (!data) return <p className="text-muted-foreground">Lädt…</p>;
  const months: Array<{ month: string; items: any[] }> = data.months || [];
  if (months.length === 0) return <p className="text-muted-foreground">Keine Termine im aktuellen Filter.</p>;
  return (
    <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
      {months.map((m) => {
        const d = parseISO(m.month + "-01");
        return (
          <div key={m.month}>
            <div className="sticky top-0 bg-background py-2 z-10 border-b mb-2">
              <h3 className="text-lg font-semibold">{format(d, "LLLL yyyy", { locale: de })} <span className="text-sm text-muted-foreground font-normal">({m.items.length} Termine)</span></h3>
            </div>
            <div className="space-y-2">
              {m.items.map((it: any) => {
                const start = parseISO(it.start_date);
                const end = parseISO(it.end_date);
                const isPublicTour = it.kind === "public_tour";
                const isCharter = it.kind === "charter";
                return (
                  <Card key={`${it.kind}-${it.id}`}>
                    <CardContent className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                          {isPublicTour ? (
                            <Badge variant="default">Öff. Tour</Badge>
                          ) : isCharter ? (
                            <Badge variant="secondary">Charter</Badge>
                          ) : (
                            <Badge variant="outline">Ticket</Badge>
                          )}
                          <span>{it.tour_type || "Charter"}</span>
                          {!isPublicTour && it.customer_name && <span className="text-sm text-muted-foreground">· {it.customer_name}</span>}
                          {it.status === "cancelled" && <Badge variant="destructive">Storniert</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(start, "EEE, d. MMM HH:mm", { locale: de })} – {format(end, "HH:mm")}
                          {" · "}Boot: <strong>{boatName(it.boat_id)}</strong>
                          {" · "}Bootsführer: <strong>{captainName(it.captain_id)}</strong>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {isPublicTour
                            ? `${it.seats_booked ?? 0} / ${it.seats_total ?? 0} Plätze gebucht`
                            : `${it.participants ?? 0} P. · ${formatPrice(it.total_price ?? 0)}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CaptainsScheduleTab({ filters }: { filters: Filters }) {
  const { data: captains = [] } = useQuery({ queryKey: ["captains"], queryFn: () => api.listCaptains() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal-Plan</CardTitle>
        <p className="text-sm text-muted-foreground">Wählen Sie oben einen Bootsführer im Filter, um nur dessen Termine zu sehen. Liste ist nach Monat scrollbar.</p>
        {!filters.captainId && (
          <p className="text-xs text-muted-foreground mt-1">Aktuell: alle {captains.length} Bootsführer.</p>
        )}
      </CardHeader>
      <CardContent><ScheduleList kind="captain-schedule" filters={filters} /></CardContent>
    </Card>
  );
}

function BoatsScheduleTab({ filters }: { filters: Filters }) {
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: () => api.listBoats() });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Boote-Plan</CardTitle>
        <p className="text-sm text-muted-foreground">Wählen Sie oben ein Boot im Filter, um nur dessen Termine zu sehen. Liste ist nach Monat scrollbar.</p>
        {!filters.boatId && (
          <p className="text-xs text-muted-foreground mt-1">Aktuell: alle {boats.length} Boote.</p>
        )}
      </CardHeader>
      <CardContent><ScheduleList kind="boat-schedule" filters={filters} /></CardContent>
    </Card>
  );
}

export default function Reports() {
  const [filters, setFilters] = useState<Filters>({});
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Berichte</h1>
          <p className="text-muted-foreground">Auswertungen und KPIs zu Finanzen, Touren, Personal und Booten.</p>
        </div>
        <FilterBar value={filters} onChange={setFilters} />
        <Tabs defaultValue="finance">
          <TabsList>
            <TabsTrigger value="finance">Finanzen</TabsTrigger>
            <TabsTrigger value="tours">Touren / Events</TabsTrigger>
            <TabsTrigger value="captains">Personal</TabsTrigger>
            <TabsTrigger value="captain-schedule">Personal-Plan</TabsTrigger>
            <TabsTrigger value="boats">Boote</TabsTrigger>
            <TabsTrigger value="boat-schedule">Boote-Plan</TabsTrigger>
            <TabsTrigger value="customers">Kunden</TabsTrigger>
          </TabsList>
          <TabsContent value="finance" className="mt-6"><FinanceTab filters={filters} /></TabsContent>
          <TabsContent value="tours" className="mt-6"><ToursTab filters={filters} /></TabsContent>
          <TabsContent value="captains" className="mt-6"><CaptainsTab filters={filters} /></TabsContent>
          <TabsContent value="captain-schedule" className="mt-6"><CaptainsScheduleTab filters={filters} /></TabsContent>
          <TabsContent value="boats" className="mt-6"><BoatsTab filters={filters} /></TabsContent>
          <TabsContent value="boat-schedule" className="mt-6"><BoatsScheduleTab filters={filters} /></TabsContent>
          <TabsContent value="customers" className="mt-6"><CustomersTab filters={filters} /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
