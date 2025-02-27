import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getServices, 
  getServiceById, 
  addService, 
  updateService, 
  deleteService,
  Service
} from '../lib/api/servicesApi';

export function useServices(options?: Parameters<typeof getServices>[0]) {
  return useQuery({
    queryKey: ['services', options],
    queryFn: () => getServices(options),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => getServiceById(id),
    enabled: !!id,
  });
}

export function useAddService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (service: Service) => addService(service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Service> }) => 
      updateService(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services', data.id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}