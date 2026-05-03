import client from './client';
import {
  UserCreate,
  BoatResponse,
  CaptainResponse,
  BookingResponse,
  AuthTokens,
} from '../types/api';

// Auth endpoints
export const authAPI = {
  register: async (data: UserCreate) => {
    const response = await client.post('/auth/register', data);
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await client.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },
};

// User endpoints
export const userAPI = {
  getProfile: async () => {
    const response = await client.get('/users/me');
    return response.data;
  },
  updateProfile: async (data: Partial<UserCreate>) => {
    const response = await client.put('/users/me', data);
    return response.data;
  },
  listUsers: async () => {
    const response = await client.get('/users');
    return response.data;
  },
  updateRole: async (userId: string, role: string) => {
    const response = await client.put(`/users/${userId}/role`, { role });
    return response.data;
  },
};

// Boat endpoints
export const boatAPI = {
  list: async () => {
    const response = await client.get('/boats');
    return response.data;
  },
  get: async (id: string) => {
    const response = await client.get(`/boats/${id}`);
    return response.data;
  },
  create: async (data: Partial<BoatResponse>) => {
    const response = await client.post('/boats', data);
    return response.data;
  },
  update: async (id: string, data: Partial<BoatResponse>) => {
    const response = await client.put(`/boats/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await client.delete(`/boats/${id}`);
  },
};

// Captain endpoints
export const captainAPI = {
  list: async () => {
    const response = await client.get('/captains');
    return response.data;
  },
  get: async (id: string) => {
    const response = await client.get(`/captains/${id}`);
    return response.data;
  },
  create: async (data: Partial<CaptainResponse>) => {
    const response = await client.post('/captains', data);
    return response.data;
  },
  update: async (id: string, data: Partial<CaptainResponse>) => {
    const response = await client.put(`/captains/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await client.delete(`/captains/${id}`);
  },
  assignBoats: async (captainId: string, boatIds: string[]) => {
    const response = await client.post(`/captains/${captainId}/boats`, { boat_ids: boatIds });
    return response.data;
  },
};

// Booking endpoints
export const bookingAPI = {
  list: async () => {
    const response = await client.get('/bookings');
    return response.data;
  },
  get: async (id: string) => {
    const response = await client.get(`/bookings/${id}`);
    return response.data;
  },
  create: async (data: Partial<BookingResponse>) => {
    const response = await client.post('/bookings', data);
    return response.data;
  },
  update: async (id: string, data: Partial<BookingResponse>) => {
    const response = await client.put(`/bookings/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await client.delete(`/bookings/${id}`);
  },
  checkAvailability: async (boatId: string, startDate: string, endDate: string) => {
    const response = await client.get('/bookings/check-availability', {
      params: { boat_id: boatId, start_date: startDate, end_date: endDate },
    });
    return response.data;
  },
};
