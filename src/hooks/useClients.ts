import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClients, 
  getClientById, 
  addClient, 
  updateClient, 
  deleteClient,
  Client
} from '../lib/api/clientsApi';

export function useClients(options?: Parameters<typeof getClients>[0]) {
  return useQuery({
    queryKey: ['clients', options],
    queryFn: () => getClients(options),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => getClientById(id),
    enabled: !!id,
  });
}

export function useAddClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (client: Client) => addClient(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) => 
      updateClient(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}