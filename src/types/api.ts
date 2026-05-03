// Auth types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserCreate {
  email: string;
  password: string;
  name: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'captain' | 'user';
  created_at: string;
  updated_at: string;
}

// Boat types
export interface BoatResponse {
  id: string;
  name: string;
  type: string;
  capacity: number;
  license_plate: string;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface BoatCreate {
  name: string;
  type: string;
  capacity: number;
  license_plate: string;
  year: number;
}

// Captain types
export interface CaptainResponse {
  id: string;
  user_id: string;
  license_number: string;
  experience_years: number;
  boats: BoatResponse[];
  created_at: string;
  updated_at: string;
}

export interface CaptainCreate {
  user_id: string;
  license_number: string;
  experience_years: number;
}

// Booking types
export interface BookingResponse {
  id: string;
  boat_id: string;
  captain_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  num_passengers: number;
  tour_route: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BookingCreate {
  boat_id: string;
  captain_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  num_passengers: number;
  tour_route: string;
  total_price: number;
  notes?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// Availability check response
export interface AvailabilityResponse {
  available: boolean;
  message?: string;
}
