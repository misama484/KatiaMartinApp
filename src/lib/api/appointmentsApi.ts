import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

export type Appointment = {
  id?: string;
  client_id: string;
  worker_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  location: string;
};

export async function getAppointments(options?: { 
  id?: string;
  client_id?: string;
  worker_id?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        client:clients(first_name, last_name),
        worker:workers(first_name, last_name),
        service:services(name)
      `);
    
    // Filter by ID if provided
    if (options?.id) {
      query = query.eq('id', options.id);
    }
    
    // Filter by client_id if provided
    if (options?.client_id) {
      query = query.eq('client_id', options.client_id);
    }
    
    // Filter by worker_id if provided
    if (options?.worker_id) {
      query = query.eq('worker_id', options.worker_id);
    }
    
    // Filter by status if provided
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    
    // Filter by date range if provided
    if (options?.startDate) {
      query = query.gte('start_time', options.startDate);
    }
    
    if (options?.endDate) {
      query = query.lte('start_time', options.endDate);
    }
    
    // Add pagination if provided
    if (options?.page !== undefined && options?.pageSize !== undefined) {
      const from = options.page * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }
    
    // Order by start_time
    query = query.order('start_time', { ascending: true });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return { data, count };
  } catch (error: any) {
    toast.error(`Error fetching appointments: ${error.message}`);
    return { data: [], count: 0 };
  }
}

export async function getAppointmentById(id: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(first_name, last_name),
        worker:workers(first_name, last_name),
        service:services(name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    toast.error(`Error fetching appointment: ${error.message}`);
    return null;
  }
}

export async function addAppointment(appointment: Appointment) {
  try {
    // Check for worker availability using proper time overlap check
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('*')
      .eq('worker_id', appointment.worker_id)
      .neq('status', 'cancelled')
      .or(
        `and(start_time.lte.${appointment.end_time},end_time.gt.${appointment.start_time}),` +
        `and(start_time.lt.${appointment.end_time},end_time.gte.${appointment.start_time}),` +
        `and(start_time.gte.${appointment.start_time},end_time.lte.${appointment.end_time})`
      );
    
    if (checkError) throw checkError;
    
    if (existingAppointments && existingAppointments.length > 0) {
      throw new Error('Worker already has an appointment during this time slot');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Appointment scheduled successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error scheduling appointment: ${error.message}`);
    return null;
  }
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  try {
    // If updating time or worker, check for availability
    if ((updates.start_time || updates.end_time || updates.worker_id) && 
        (updates.worker_id || updates.start_time || updates.end_time)) {
      
      // Get current appointment data
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const worker_id = updates.worker_id || currentAppointment.worker_id;
      const start_time = updates.start_time || currentAppointment.start_time;
      const end_time = updates.end_time || currentAppointment.end_time;
      
      // Check for worker availability using proper time overlap check
      const { data: existingAppointments, error: checkError } = await supabase
        .from('appointments')
        .select('*')
        .eq('worker_id', worker_id)
        .neq('id', id) // Exclude current appointment
        .neq('status', 'cancelled')
        .or(
          `and(start_time.lte.${end_time},end_time.gt.${start_time}),` +
          `and(start_time.lt.${end_time},end_time.gte.${start_time}),` +
          `and(start_time.gte.${start_time},end_time.lte.${end_time})`
        );
      
      if (checkError) throw checkError;
      
      if (existingAppointments && existingAppointments.length > 0) {
        throw new Error('Worker already has an appointment during this time slot');
      }
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Appointment updated successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error updating appointment: ${error.message}`);
    return null;
  }
}

export async function deleteAppointment(id: string) {
  try {
    // Check if appointment has invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('appointment_id', id);
    
    if (invoicesError) throw invoicesError;
    
    if (invoices && invoices.length > 0) {
      throw new Error('Cannot delete appointment with existing invoices');
    }
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Appointment deleted successfully');
    return true;
  } catch (error: any) {
    toast.error(`Error deleting appointment: ${error.message}`);
    return false;
  }
}