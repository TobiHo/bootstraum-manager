import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { BookingData } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { calculatePrice, getDurationHours, formatPrice, TOUR_TYPES } from "@/lib/pricing";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const Reports = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await api.listBookings();
      setBookings(data);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Berichte konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const getBookingPrice = (booking: BookingData) => {
    const durationHours = getDurationHours(booking.startDate, booking.endDate);
    return calculatePrice(booking.tourType, booking.participants, 25, durationHours);
  };

  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.startDate);
    return b.status === "confirmed" && bookingDate >= currentMonth && bookingDate < nextMonth;
  });

  const lastMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.startDate);
    return b.status === "confirmed" && bookingDate >= lastMonth && bookingDate < currentMonth;
  });

  const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + getBookingPrice(b), 0);
  const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + getBookingPrice(b), 0);
  const avgBookingValue = thisMonthBookings.length > 0 ? thisMonthRevenue / thisMonthBookings.length : 0;

  // Revenue by tour type
  const revenueByTourType: { name: string; revenue: number }[] = [];
  const tourTypeCounts: { [key: string]: number } = {};

  thisMonthBookings.forEach(booking => {
    const tourType = booking.tourType || "Ohne Typ";
    const price = getBookingPrice(booking);
    const existing = revenueByTourType.find(r => r.name === tourType);
    if (existing) {
      existing.revenue += price;
    } else {
      revenueByTourType.push({ name: tourType, revenue: price });
    }
    tourTypeCounts[tourType] = (tourTypeCounts[tourType] || 0) + 1;
  });

  const COLORS = ["#0055CC", "#FF6B35", "#FFA502", "#F7931E", "#2ECC71", "#3498DB"];

  // Recent bookings (last 10)
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 10);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Bestätigt";
      case "pending":
        return "Ausstehend";
      case "cancelled":
        return "Storniert";
      default:
        return status;
    }
  };

  const getTourTypeLabel = (tourType: string | undefined) => {
    if (!tourType) return "Ohne Typ";
    const tourTypeObj = TOUR_TYPES.find(t => t.value === tourType);
    return tourTypeObj ? tourTypeObj.label : tourType;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Berichte</h1>
            <p className="text-muted-foreground mt-1">Übersicht über Buchungen und Umsatz</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Umsatz diesen Monat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{formatPrice(thisMonthRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {thisMonthBookings.length} Buchungen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Umsatz letzter Monat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{formatPrice(lastMonthRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lastMonthBookings.length} Buchungen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ø Buchungswert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{formatPrice(avgBookingValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Diesen Monat</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Tour Type Chart */}
          {revenueByTourType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Umsatz nach Tourtyp (diesen Monat)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByTourType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Bar dataKey="revenue" fill="#0055CC">
                      {revenueByTourType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Aktuelle Buchungen (letzte 10)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Wird geladen...</p>
              ) : recentBookings.length === 0 ? (
                <p className="text-center text-muted-foreground">Keine Buchungen vorhanden</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Tourtyp</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Teilnehmer</TableHead>
                        <TableHead>Preis</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="text-sm">
                            {new Date(booking.startDate).toLocaleDateString("de-DE", {
                              weekday: "short",
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {new Date(booking.startDate).toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {getTourTypeLabel(booking.tourType)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {booking.customer.name}
                          </TableCell>
                          <TableCell className="text-sm">{booking.participants}</TableCell>
                          <TableCell className="text-sm font-semibold text-primary">
                            {formatPrice(getBookingPrice(booking))}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
