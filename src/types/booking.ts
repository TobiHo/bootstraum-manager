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
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: BookingData;
}