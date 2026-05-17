import { Boat, BookingData, Captain, TourType, PublicTour, CaptainAbsence } from "@/types/booking";

/**
 * Resolve the API base URL.
 *
 * Priority:
 *   Production browsers always use same-origin /api so Vercel rewrites the
 *   request to Railway. Local development may still use an override/env target.
 */
function resolveApiBase(): string {
  const normalize = (value: string) => {
    const trimmed = value.trim().replace(/\/$/, "");
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const isBrowser = typeof window !== "undefined";
  const host = isBrowser ? window.location.hostname : "";
  const isLocalPage = ["localhost", "127.0.0.1"].includes(host);
  // Vercel-hosted production uses same-origin /api (rewrite to Railway).
  const isVercelHost = /vercel\.app$/i.test(host) || host === "bootstraum-manager.vercel.app";

  try {
    const override = isBrowser ? window.localStorage.getItem("api_base_url") : null;
    if (override) return normalize(override);
  } catch {
    /* localStorage unavailable */
  }
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return normalize(String(env));

  if (isBrowser && !isLocalPage && !isVercelHost) {
    // Lovable preview or other hosts: hit Railway backend directly (CORS=*).
    return "https://bootstraum-manager-production.up.railway.app";
  }
  return "";
}

const API_BASE_URL = resolveApiBase();

export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "staff" | "captain" | "customer";
  created_at: string;
  updated_at: string;
}

type ApiBoat = {
  id: number;
  name: string;
  capacity: number;
  boat_type: string;
  description?: string | null;
  available: boolean;
};

type ApiCaptain = {
  id: number;
  name: string;
  email: string;
  phone: string;
  certifications?: string | null;
  available_boats?: number[];
};

type ApiBooking = {
  id: number;
  boat_id: number;
  captain_id?: number | null;
  start_date: string;
  end_date: string;
  participants: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  tour_type?: string | null;
  status: "confirmed" | "pending" | "cancelled";
  notes?: string | null;
  created_at: string;
};

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    let message: string | undefined;
    const detail = error?.detail;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((d: any) => {
          if (typeof d === "string") return d;
          const loc = Array.isArray(d?.loc) ? d.loc.filter((x: any) => x !== "body").join(".") : "";
          return loc ? `${loc}: ${d?.msg ?? "ungültig"}` : (d?.msg ?? JSON.stringify(d));
        })
        .join("; ");
    } else if (detail && typeof detail === "object") {
      message = detail.msg || JSON.stringify(detail);
    }
    throw new Error(message || `API request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

const toBoat = (boat: ApiBoat): Boat => ({
  id: String(boat.id),
  name: boat.name,
  capacity: boat.capacity,
  type: boat.boat_type,
  description: boat.description ?? "",
  available: boat.available,
});

const toCaptain = (captain: ApiCaptain): Captain => ({
  id: String(captain.id),
  name: captain.name,
  email: captain.email,
  phone: captain.phone,
  certifications: captain.certifications
    ? captain.certifications.split(",").map((cert) => cert.trim()).filter(Boolean)
    : [],
  availableBoats: (captain.available_boats ?? []).map(String),
});

const toBooking = (booking: ApiBooking): BookingData => ({
  id: String(booking.id),
  startDate: new Date(booking.start_date),
  endDate: new Date(booking.end_date),
  customer: {
    name: booking.customer_name,
    email: booking.customer_email,
    phone: booking.customer_phone,
  },
  participants: booking.participants,
  boatId: String(booking.boat_id),
  captainId: booking.captain_id ? String(booking.captain_id) : "",
  catering: (booking as any).catering ?? false,
  notes: booking.notes ?? "",
  tourType: booking.tour_type ?? undefined,
  status: booking.status,
  paymentStatus: (booking as any).payment_status ?? "unpaid",
  bookingKind: ((booking as any).booking_kind ?? "charter") as "charter" | "public",
  publicTourId: (booking as any).public_tour_id ? String((booking as any).public_tour_id) : undefined,
  totalPrice: (booking as any).total_price ?? undefined,
  createdAt: new Date(booking.created_at),
});

const boatPayload = (boat: Omit<Boat, "id">) => ({
  name: boat.name,
  capacity: boat.capacity,
  boat_type: boat.type,
  description: boat.description,
  available: boat.available,
});

const captainPayload = (captain: Omit<Captain, "id">) => ({
  name: captain.name,
  email: captain.email,
  phone: captain.phone,
  certifications: captain.certifications.join(", "),
});

const bookingPayload = (booking: Omit<BookingData, "id" | "createdAt">) => ({
  boat_id: Number(booking.boatId),
  captain_id: booking.captainId ? Number(booking.captainId) : null,
  start_date: booking.startDate.toISOString(),
  end_date: booking.endDate.toISOString(),
  participants: booking.participants,
  customer_name: booking.customer.name,
  customer_email: booking.customer.email,
  customer_phone: booking.customer.phone,
  tour_type: booking.tourType || null,
  notes: booking.notes,
  status: booking.status,
  catering: booking.catering,
  payment_status: booking.paymentStatus ?? "unpaid",
});

async function assignCaptainBoats(captainId: string, boatIds: string[]) {
  return request<ApiCaptain>(`/api/captains/${captainId}/boats`, {
    method: "PUT",
    body: JSON.stringify({ boat_ids: boatIds.map(Number) }),
  });
}

export const api = {
  async listBoats() {
    return (await request<ApiBoat[]>("/api/boats")).map(toBoat);
  },
  async createBoat(boat: Omit<Boat, "id">) {
    return toBoat(await request<ApiBoat>("/api/boats", {
      method: "POST",
      body: JSON.stringify(boatPayload(boat)),
    }));
  },
  async updateBoat(id: string, boat: Omit<Boat, "id">) {
    return toBoat(await request<ApiBoat>(`/api/boats/${id}`, {
      method: "PUT",
      body: JSON.stringify(boatPayload(boat)),
    }));
  },
  async deleteBoat(id: string) {
    await request<void>(`/api/boats/${id}`, { method: "DELETE" });
  },
  async listCaptains() {
    return (await request<ApiCaptain[]>("/api/captains")).map(toCaptain);
  },
  async createCaptain(captain: Omit<Captain, "id">) {
    const created = await request<ApiCaptain>("/api/captains", {
      method: "POST",
      body: JSON.stringify(captainPayload(captain)),
    });
    return toCaptain(await assignCaptainBoats(String(created.id), captain.availableBoats));
  },
  async updateCaptain(id: string, captain: Omit<Captain, "id">) {
    await request<ApiCaptain>(`/api/captains/${id}`, {
      method: "PUT",
      body: JSON.stringify(captainPayload(captain)),
    });
    return toCaptain(await assignCaptainBoats(id, captain.availableBoats));
  },
  async deleteCaptain(id: string) {
    await request<void>(`/api/captains/${id}`, { method: "DELETE" });
  },
  async listBookings() {
    return (await request<ApiBooking[]>("/api/bookings?limit=1000")).map(toBooking);
  },
  async createBooking(booking: Omit<BookingData, "id" | "createdAt">) {
    return toBooking(await request<ApiBooking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(bookingPayload(booking)),
    }));
  },
  async updateBooking(booking: BookingData) {
    return toBooking(await request<ApiBooking>(`/api/bookings/${booking.id}`, {
      method: "PUT",
      body: JSON.stringify(bookingPayload(booking)),
    }));
  },
  async cancelBooking(bookingId: string) {
    return toBooking(await request<ApiBooking>(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
    }));
  },
  async deleteBooking(id: string) {
    await request<void>(`/api/bookings/${id}`, { method: "DELETE" });
  },
  // ============ Tour Types ============
  async listTourTypes(onlyActive = false) {
    const data = await request<any[]>(`/api/tour-types${onlyActive ? "?only_active=true" : ""}`);
    return data.map(toTourType);
  },
  async getTourTypeBySlug(slug: string) {
    return toTourType(await request<any>(`/api/tour-types/by-slug/${slug}`));
  },
  async createTourType(t: Omit<TourType, "id">) {
    return toTourType(await request<any>("/api/tour-types", {
      method: "POST",
      body: JSON.stringify(tourTypePayload(t)),
    }));
  },
  async updateTourType(id: string, t: Omit<TourType, "id">) {
    return toTourType(await request<any>(`/api/tour-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(tourTypePayload(t)),
    }));
  },
  async deleteTourType(id: string) {
    await request<void>(`/api/tour-types/${id}`, { method: "DELETE" });
  },
  // ============ Public Tours (slots) ============
  async listPublicTours(params: { from?: Date; to?: Date; tourTypeId?: string; boatId?: string; captainId?: string; category?: "rundfahrt" | "event"; status?: string; includeCancelled?: boolean; onlyAvailable?: boolean } = {}) {
    const qs = new URLSearchParams();
    if (params.from) qs.set("from_date", params.from.toISOString());
    if (params.to) qs.set("to_date", params.to.toISOString());
    if (params.tourTypeId) qs.set("tour_type_id", params.tourTypeId);
    if (params.boatId) qs.set("boat_id", params.boatId);
    if (params.captainId) qs.set("captain_id", params.captainId);
    if (params.category) qs.set("category", params.category);
    if (params.status) qs.set("status", params.status);
    if (params.includeCancelled) qs.set("include_cancelled", "true");
    if (params.onlyAvailable) qs.set("only_available", "true");
    const data = await request<any[]>(`/api/public-tours${qs.toString() ? `?${qs}` : ""}`);
    return data.map(toPublicTour);
  },
  async createPublicTour(p: { tourTypeId: string; boatId: string; captainId?: string; startDate: Date; endDate: Date; seatsTotal: number }) {
    return toPublicTour(await request<any>("/api/public-tours", {
      method: "POST",
      body: JSON.stringify({
        tour_type_id: Number(p.tourTypeId),
        boat_id: Number(p.boatId),
        captain_id: p.captainId ? Number(p.captainId) : null,
        start_date: p.startDate.toISOString(),
        end_date: p.endDate.toISOString(),
        seats_total: p.seatsTotal,
      }),
    }));
  },
  async updatePublicTour(id: string, p: { tourTypeId?: string; boatId?: string; captainId?: string | null; startDate?: Date; endDate?: Date; seatsTotal?: number; status?: string; cancellationReason?: string | null }) {
    const body: any = {};
    if (p.tourTypeId) body.tour_type_id = Number(p.tourTypeId);
    if (p.boatId) body.boat_id = Number(p.boatId);
    if (p.captainId !== undefined) body.captain_id = p.captainId ? Number(p.captainId) : null;
    if (p.startDate) body.start_date = p.startDate.toISOString();
    if (p.endDate) body.end_date = p.endDate.toISOString();
    if (p.seatsTotal != null) body.seats_total = p.seatsTotal;
    if (p.status) body.status = p.status;
    if (p.cancellationReason !== undefined) body.cancellation_reason = p.cancellationReason;
    return toPublicTour(await request<any>(`/api/public-tours/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }));
  },
  async cancelPublicTourWithReason(id: string, reason: string) {
    return toPublicTour(await request<any>(`/api/public-tours/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }));
  },
  async createPublicTourSeries(p: {
    tourTypeId: string;
    boatId: string;
    captainId?: string;
    seatsTotal: number;
    seriesStart: Date;
    seriesEnd: Date;
    weekdays?: number[];
    times: string[]; // ["10:00", "14:00"]
    durationMinutes: number;
  }) {
    const data = await request<any[]>("/api/public-tours/series", {
      method: "POST",
      body: JSON.stringify({
        tour_type_id: Number(p.tourTypeId),
        boat_id: Number(p.boatId),
        captain_id: p.captainId ? Number(p.captainId) : null,
        seats_total: p.seatsTotal,
        series_start: p.seriesStart.toISOString(),
        series_end: p.seriesEnd.toISOString(),
        weekdays: p.weekdays ?? null,
        times: p.times,
        duration_minutes: p.durationMinutes,
      }),
    });
    return data.map(toPublicTour);
  },
  async cancelPublicTour(id: string) {
    await request<void>(`/api/public-tours/${id}`, { method: "DELETE" });
  },
  async purgePublicTours(category?: "rundfahrt" | "event") {
    const qs = category ? `?category=${category}` : "";
    return request<{ deleted_tours: number; deleted_bookings: number }>(`/api/public-tours/purge${qs}`, { method: "DELETE" });
  },
  async buyTickets(publicTourId: string, payload: { quantity: number; customer: { name: string; email: string; phone: string }; catering: boolean; notes?: string; paymentMethod?: "online" | "onsite" }) {
    return toBooking(await request<ApiBooking>(`/api/public-tours/${publicTourId}/tickets`, {
      method: "POST",
      body: JSON.stringify({
        public_tour_id: Number(publicTourId),
        quantity: payload.quantity,
        customer_name: payload.customer.name,
        customer_email: payload.customer.email,
        customer_phone: payload.customer.phone,
        catering: payload.catering,
        notes: payload.notes ?? null,
        payment_method: payload.paymentMethod ?? "online",
      }),
    }));
  },
  // ============ Public Charter ============
  async createPublicCharter(payload: { boatId: string; startDate: Date; endDate: Date; participants: number; customer: { name: string; email: string; phone: string }; catering: boolean; notes?: string; tourType?: string; tourTypeSlug?: string; paymentMethod?: "online" | "onsite" }) {
    return toBooking(await request<ApiBooking>("/api/public/charter", {
      method: "POST",
      body: JSON.stringify({
        boat_id: Number(payload.boatId),
        start_date: payload.startDate.toISOString(),
        end_date: payload.endDate.toISOString(),
        participants: payload.participants,
        customer_name: payload.customer.name,
        customer_email: payload.customer.email,
        customer_phone: payload.customer.phone,
        catering: payload.catering,
        notes: payload.notes ?? null,
        tour_type: payload.tourType ?? null,
        tour_type_slug: payload.tourTypeSlug ?? null,
        payment_method: payload.paymentMethod ?? "online",
      }),
    }));
  },
  // ============ Captain Absences ============
  async listMyAbsences() {
    return (await request<any[]>("/api/captains/me/absences")).map(toAbsence);
  },
  async createMyAbsence(p: { startDate: Date; endDate: Date; reason: CaptainAbsence["reason"]; notes?: string }) {
    return toAbsence(await request<any>("/api/captains/me/absences", {
      method: "POST",
      body: JSON.stringify({
        start_date: p.startDate.toISOString(),
        end_date: p.endDate.toISOString(),
        reason: p.reason,
        notes: p.notes ?? null,
      }),
    }));
  },
  async deleteMyAbsence(id: string) {
    await request<void>(`/api/captains/me/absences/${id}`, { method: "DELETE" });
  },
  async listCaptainAbsences(captainId: string) {
    return (await request<any[]>(`/api/captains/${captainId}/absences`)).map(toAbsence);
  },
  async listUsers() {
    return await request<User[]>("/api/users");
  },
  async updateUserRole(id: number, role: "admin" | "staff" | "captain" | "customer") {
    return await request<User>(`/api/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },
  async deleteUser(id: number) {
    await request<void>(`/api/users/${id}`, { method: "DELETE" });
  },
  async createStripeCheckout(bookingId: string | number) {
    return await request<{ checkout_url: string; session_id: string }>(
      "/api/payments/stripe/checkout",
      {
        method: "POST",
        body: JSON.stringify({ booking_id: Number(bookingId) }),
      }
    );
  },
  // ============ Reports ============
  async report(kind: "finance" | "tours" | "captains" | "boats" | "customers" | "captain-schedule" | "boat-schedule", params: { from?: Date; to?: Date; boatId?: string; captainId?: string; tourTypeId?: string; paymentMethod?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.from) qs.set("from_date", params.from.toISOString());
    if (params.to) qs.set("to_date", params.to.toISOString());
    if (params.boatId) qs.set("boat_id", params.boatId);
    if (params.captainId) qs.set("captain_id", params.captainId);
    if (params.tourTypeId) qs.set("tour_type_id", params.tourTypeId);
    if (params.paymentMethod) qs.set("payment_method", params.paymentMethod);
    return await request<any>(`/api/reports/${kind}${qs.toString() ? `?${qs}` : ""}`);
  },
  async registerUser(email: string, password: string, name: string, role: "admin" | "staff" | "captain" | "customer" = "customer") {
    return await request<{ access_token: string; refresh_token: string; token_type: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
  },
};

const toTourType = (t: any): TourType => ({
  id: String(t.id),
  slug: t.slug,
  name: t.name,
  description: t.description ?? "",
  durationMinutes: t.duration_minutes,
  pricePerTicket: t.price_per_ticket,
  minParticipants: t.min_participants,
  maxParticipants: t.max_participants,
  imageUrl: t.image_url ?? undefined,
  active: t.active,
  category: (t.category as any) ?? "rundfahrt",
});

const tourTypePayload = (t: Omit<TourType, "id">) => ({
  slug: t.slug,
  name: t.name,
  description: t.description,
  duration_minutes: t.durationMinutes,
  price_per_ticket: t.pricePerTicket,
  min_participants: t.minParticipants,
  max_participants: t.maxParticipants,
  image_url: t.imageUrl,
  active: t.active,
  category: t.category ?? "rundfahrt",
});

const toPublicTour = (p: any): PublicTour => ({
  id: String(p.id),
  tourTypeId: String(p.tour_type_id),
  boatId: String(p.boat_id),
  captainId: p.captain_id ? String(p.captain_id) : undefined,
  startDate: new Date(p.start_date),
  endDate: new Date(p.end_date),
  seatsTotal: p.seats_total,
  seatsBooked: p.seats_booked,
  status: p.status,
  cancellationReason: p.cancellation_reason ?? undefined,
});

const toAbsence = (a: any): CaptainAbsence => ({
  id: String(a.id),
  captainId: String(a.captain_id),
  startDate: new Date(a.start_date),
  endDate: new Date(a.end_date),
  reason: a.reason,
  notes: a.notes ?? undefined,
});
