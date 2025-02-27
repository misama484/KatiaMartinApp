import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

export type Invoice = {
  id?: string;
  client_id: string;
  appointment_id: string;
  amount: number;
  status?: 'draft' | 'pending' | 'paid' | 'cancelled';
  due_date: string;
  paid_date?: string;
  notes?: string;
};

export async function getInvoices(options?: { 
  id?: string;
  client_id?: string;
  appointment_id?: string;
  status?: 'draft' | 'pending' | 'paid' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(first_name, last_name)
      `);
    
    // Filter by ID if provided
    if (options?.id) {
      query = query.eq('id', options.id);
    }
    
    // Filter by client_id if provided
    if (options?.client_id) {
      query = query.eq('client_id', options.client_id);
    }
    
    // Filter by appointment_id if provided
    if (options?.appointment_id) {
      query = query.eq('appointment_id', options.appointment_id);
    }
    
    // Filter by status if provided
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    
    // Filter by date range if provided
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
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
    toast.error(`Error fetching invoices: ${error.message}`);
    return { data: [], count: 0 };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(first_name, last_name, email, phone, address),
        appointment:appointments(
          start_time, 
          end_time, 
          service_id,
          service:services(name, description)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    toast.error(`Error fetching invoice: ${error.message}`);
    return null;
  }
}

export async function addInvoice(invoice: Invoice) {
  try {
    // Check if appointment already has an invoice
    const { data: existingInvoices, error: checkError } = await supabase
      .from('invoices')
      .select('id')
      .eq('appointment_id', invoice.appointment_id);
    
    if (checkError) throw checkError;
    
    if (existingInvoices && existingInvoices.length > 0) {
      throw new Error('This appointment already has an invoice');
    }
    
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Invoice created successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error creating invoice: ${error.message}`);
    return null;
  }
}

export async function updateInvoice(id: string, updates: Partial<Invoice>) {
  try {
    // If marking as paid, set paid_date to today if not provided
    if (updates.status === 'paid' && !updates.paid_date) {
      updates.paid_date = new Date().toISOString().split('T')[0];
    }
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    toast.success('Invoice updated successfully');
    return data;
  } catch (error: any) {
    toast.error(`Error updating invoice: ${error.message}`);
    return null;
  }
}

export async function deleteInvoice(id: string) {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('Invoice deleted successfully');
    return true;
  } catch (error: any) {
    toast.error(`Error deleting invoice: ${error.message}`);
    return false;
  }
}