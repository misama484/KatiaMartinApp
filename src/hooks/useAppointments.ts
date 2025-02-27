import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAppointments, 
  getAppointmentById, 
  addAppointment, 
  updateAppointment, 
  deleteAppointment,
  Appointment
} from '../lib/api/appointmentsApi';

export function useAppointments(options?: Parameters<typeof getAppointments>[0]) {
  return useQuery({
    queryKey: ['appointments', options],
    queryFn: () => getAppointments(options),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => getAppointmentById(id),
    enabled: !!id,
  });
}

export function useAddAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointment: Appointment) => addAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Appointment> }) => 
      updateAppointment(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', data.id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}