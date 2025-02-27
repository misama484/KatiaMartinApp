import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

export type Service = {
  id?: string;
  name: string;
  description?: string;
  duration_minutes: number;
  base_price: number;
  active?: boolean;
};

export async function getServices(options?: { 
  id?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}) {
  try {
    let query = supabase.from('services').select('*');
    
    // Filter by ID if provided
    if (options?.id) {
      query = query.eq('id', options.id);
    }
    
    // Filter by active status if provided
    if (options?.active !== undefined) {
      query = query.eq('active', options.active);
    }
    
    // Add pagination if provided
    if (options?.page !== undefined && options?.pageSize !== undefined) {
      const from = options.page * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }
    
    // Order by name
    query = query.order('name', { ascending: true });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return { data, count };
  } catch (error: any) {
    toast.error(`Error fetching services: ${error.message}`);
    return { data: [], count: 0 };
  }
}

export async function getServiceById(id: string) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    toast.error(`Error fetching service: ${error.message}`);
    return null;
  }
}

export async function addService(service: Service) {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Service added successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error adding service: ${error.message}`);
    return null;
  }
}

export async function updateService(id: string, updates: Partial<Service>) {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Service updated successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error updating service: ${error.message}`);
    return null;
  }
}

export async function deleteService(id: string) {
  try {
    // Check if service has appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('service_id', id);
    
    if (appointmentsError) throw appointmentsError;
    
    if (appointments && appointments.length > 0) {
      throw new Error('Cannot delete service with existing appointments');
    }
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Service deleted successfully');
    return true;
  } catch (error: any) {
    toast.error(`Error deleting service: ${error.message}`);
    return false;
  }
}