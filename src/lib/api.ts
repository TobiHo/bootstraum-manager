import { Boat, BookingData, Captain } from "@/types/booking";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "staff" | "customer";
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
    throw new Error(error?.detail || `API request failed with ${response.status}`);
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
  catering: false,
  notes: booking.notes ?? "",
  status: booking.status,
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
  notes: booking.notes,
  status: booking.status,
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
    return (await request<ApiBooking[]>("/api/bookings")).map(toBooking);
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
  async deleteBooking(id: string) {
    await request<void>(`/api/bookings/${id}`, { method: "DELETE" });
  },
  async listUsers() {
    return await request<User[]>("/api/users");
  },
  async updateUserRole(id: number, role: "admin" | "staff" | "customer") {
    return await request<User>(`/api/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },
  async deleteUser(id: number) {
    await request<void>(`/api/users/${id}`, { method: "DELETE" });
  },
  async registerUser(email: string, password: string, name: string, role: "admin" | "staff" | "customer" = "customer") {
    return await request<{ access_token: string; refresh_token: string; token_type: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
  },
};
