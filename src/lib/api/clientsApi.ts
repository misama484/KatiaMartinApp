import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

export type Client = {
  id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  address: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
};

export async function getClients(options?: { 
  id?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    let query = supabase.from('clients').select('*');
    
    // Filter by ID if provided
    if (options?.id) {
      query = query.eq('id', options.id);
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
    toast.error(`Error fetching clients: ${error.message}`);
    return { data: [], count: 0 };
  }
}

export async function getClientById(id: string) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    toast.error(`Error fetching client: ${error.message}`);
    return null;
  }
}

export async function addClient(client: Client) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Client added successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error adding client: ${error.message}`);
    return null;
  }
}

export async function updateClient(id: string, updates: Partial<Client>) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Client updated successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error updating client: ${error.message}`);
    return null;
  }
}

export async function deleteClient(id: string) {
  try {
    // Check if client has appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', id);
    
    if (appointmentsError) throw appointmentsError;
    
    if (appointments && appointments.length > 0) {
      throw new Error('Cannot delete client with existing appointments');
    }
    
    // Check if client has invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('client_id', id);
    
    if (invoicesError) throw invoicesError;
    
    if (invoices && invoices.length > 0) {
      throw new Error('Cannot delete client with existing invoices');
    }
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Client deleted successfully');
    return true;
  } catch (error: any) {
    toast.error(`Error deleting client: ${error.message}`);
    return false;
  }
}