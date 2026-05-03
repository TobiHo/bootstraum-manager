import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI } from '../api/endpoints';
import { BookingResponse, BookingCreate } from '../types/api';

export const useBookings = () => {
  const queryClient = useQueryClient();

  // List bookings
  const {
    data: bookings = [],
    isLoading: isLoadingList,
    error: listError,
  } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingAPI.list(),
  });

  // Create booking
  const createMutation = useMutation({
    mutationFn: (data: Partial<BookingCreate>) => bookingAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  // Update booking
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookingResponse> }) =>
      bookingAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  // Delete booking
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  // Check availability
  const checkAvailabilityMutation = useMutation({
    mutationFn: ({
      boatId,
      startDate,
      endDate,
    }: {
      boatId: string;
      startDate: string;
      endDate: string;
    }) => bookingAPI.checkAvailability(boatId, startDate, endDate),
  });

  return {
    bookings,
    isLoadingList,
    listError,
    createBooking: createMutation.mutate,
    updateBooking: updateMutation.mutate,
    deleteBooking: deleteMutation.mutate,
    checkAvailability: checkAvailabilityMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCheckingAvailability: checkAvailabilityMutation.isPending,
  };
};
