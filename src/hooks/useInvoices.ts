import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getInvoices, 
  getInvoiceById, 
  addInvoice, 
  updateInvoice, 
  deleteInvoice,
  Invoice
} from '../lib/api/invoicesApi';

export function useInvoices(options?: Parameters<typeof getInvoices>[0]) {
  return useQuery({
    queryKey: ['invoices', options],
    queryFn: () => getInvoices(options),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });
}

export function useAddInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoice: Invoice) => addInvoice(invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Invoice> }) => 
      updateInvoice(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}