import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

export type Worker = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  availability?: any;
  active?: boolean;
};

export async function getWorkers(options?: { 
  id?: string;
  searchTerm?: string;
  role?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}) {
  try {
    let query = supabase.from('workers').select('*');
    
    // Filter by ID if provided
    if (options?.id) {
      query = query.eq('id', options.id);
    }
    
    // Filter by active status if provided
    if (options?.active !== undefined) {
      query = query.eq('active', options.active);
    }
    
    // Filter by role if provided
    if (options?.role) {
      query = query.eq('role', options.role);
    }
    
    // Search by name or email if provided
    if (options?.searchTerm) {
      query = query.or(
        `first_name.ilike.%${options.searchTerm}%,last_name.ilike.%${options.searchTerm}%,email.ilike.%${options.searchTerm}%`
      );
    }
    
    // Add pagination if provided
    if (options?.page !== undefined && options?.pageSize !== undefined) {
      const from = options.page * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }
    
    // Order by created_at
    query = query.order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return { data, count };
  } catch (error: any) {
    toast.error(`Error fetching workers: ${error.message}`);
    return { data: [], count: 0 };
  }
}

export async function getWorkerById(id: string) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    toast.error(`Error fetching worker: ${error.message}`);
    return null;
  }
}

export async function addWorker(worker: Worker) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .insert([worker])
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Worker added successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error adding worker: ${error.message}`);
    return null;
  }
}

export async function updateWorker(id: string, updates: Partial<Worker>) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Worker updated successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error updating worker: ${error.message}`);
    return null;
  }
}

export async function deleteWorker(id: string) {
  try {
    // Check if worker has appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('worker_id', id);
    
    if (appointmentsError) throw appointmentsError;
    
    if (appointments && appointments.length > 0) {
      throw new Error('Cannot delete worker with existing appointments');
    }
    
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Worker deleted successfully');
    return true;
  } catch (error: any) {
    toast.error(`Error deleting worker: ${error.message}`);
    return false;
  }
}