import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getWorkers, 
  getWorkerById, 
  addWorker, 
  updateWorker, 
  deleteWorker,
  resetWorkerPassword,
  Worker
} from '../lib/api/workersApi';

export function useWorkers(options?: Parameters<typeof getWorkers>[0]) {
  return useQuery({
    queryKey: ['workers', options],
    queryFn: () => getWorkers(options),
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ['workers', id],
    queryFn: () => getWorkerById(id),
    enabled: !!id,
  });
}

export function useAddWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (worker: Worker) => addWorker(worker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Worker> }) => 
      updateWorker(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['workers', data.id] });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteWorker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export { resetWorkerPassword };