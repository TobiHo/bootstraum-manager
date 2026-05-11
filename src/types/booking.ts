export interface Boat {
  id: string;
  name: string;
  capacity: number;
  type: string;
  description?: string;
  available: boolean;
}

export interface Captain {
  id: string;
  name: string;
  email: string;
  phone: string;
  certifications: string[];
  availableBoats: string[]; // boat IDs this captain can operate
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  company?: string;
}

export interface BookingData {
  id: string;
  startDate: Date;
  endDate: Date;
  customer: Customer;
  participants: number;
  boatId: string;
  captainId: string;
  catering: boolean;
  notes?: string;
  tourType?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid' | 'pay_on_site' | 'refunded';
  bookingKind?: 'charter' | 'public';
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: BookingData;
}

export interface TourType {
  id: string;
  slug: string;
  name: string;
  description?: string;
  durationMinutes: number;
  pricePerTicket: number;
  minParticipants: number;
  maxParticipants: number;
  imageUrl?: string;
  active: boolean;
  category?: "rundfahrt" | "event";
}

export interface PublicTour {
  id: string;
  tourTypeId: string;
  boatId: string;
  captainId?: string;
  startDate: Date;
  endDate: Date;
  seatsTotal: number;
  seatsBooked: number;
  status: "scheduled" | "cancelled" | "completed";
  cancellationReason?: string;
}

export interface CaptainAbsence {
  id: string;
  captainId: string;
  startDate: Date;
  endDate: Date;
  reason: "vacation" | "sick" | "permanent" | "other";
  notes?: string;
}