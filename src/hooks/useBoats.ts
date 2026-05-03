import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boatAPI } from '../api/endpoints';
import { BoatResponse, BoatCreate } from '../types/api';

export const useBoats = () => {
  const queryClient = useQueryClient();

  // List boats
  const {
    data: boats = [],
    isLoading: isLoadingList,
    error: listError,
  } = useQuery({
    queryKey: ['boats'],
    queryFn: () => boatAPI.list(),
  });

  // Get single boat
  const getBoatQuery = (id: string) =>
    useQuery({
      queryKey: ['boats', id],
      queryFn: () => boatAPI.get(id),
      enabled: !!id,
    });

  // Create boat
  const createMutation = useMutation({
    mutationFn: (data: Partial<BoatCreate>) => boatAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
    },
  });

  // Update boat
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BoatResponse> }) =>
      boatAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
    },
  });

  // Delete boat
  const deleteMutation = useMutation({
    mutationFn: (id: string) => boatAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
    },
  });

  return {
    boats,
    isLoadingList,
    listError,
    getBoat: getBoatQuery,
    createBoat: createMutation.mutate,
    updateBoat: updateMutation.mutate,
    deleteBoat: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
