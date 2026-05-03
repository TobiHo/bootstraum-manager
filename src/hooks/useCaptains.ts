import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { captainAPI } from '../api/endpoints';
import { CaptainResponse, CaptainCreate } from '../types/api';

export const useCaptains = () => {
  const queryClient = useQueryClient();

  // List captains
  const {
    data: captains = [],
    isLoading: isLoadingList,
    error: listError,
  } = useQuery({
    queryKey: ['captains'],
    queryFn: () => captainAPI.list(),
  });

  // Get single captain
  const getCaptainQuery = (id: string) =>
    useQuery({
      queryKey: ['captains', id],
      queryFn: () => captainAPI.get(id),
      enabled: !!id,
    });

  // Create captain
  const createMutation = useMutation({
    mutationFn: (data: Partial<CaptainCreate>) => captainAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captains'] });
    },
  });

  // Update captain
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CaptainResponse> }) =>
      captainAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captains'] });
    },
  });

  // Delete captain
  const deleteMutation = useMutation({
    mutationFn: (id: string) => captainAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captains'] });
    },
  });

  // Assign boats to captain
  const assignBoatsMutation = useMutation({
    mutationFn: ({ captainId, boatIds }: { captainId: string; boatIds: string[] }) =>
      captainAPI.assignBoats(captainId, boatIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captains'] });
    },
  });

  return {
    captains,
    isLoadingList,
    listError,
    getCaptain: getCaptainQuery,
    createCaptain: createMutation.mutate,
    updateCaptain: updateMutation.mutate,
    deleteCaptain: deleteMutation.mutate,
    assignBoats: assignBoatsMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAssigningBoats: assignBoatsMutation.isPending,
  };
};
