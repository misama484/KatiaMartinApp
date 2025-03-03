import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import { generateRandomPassword } from '../utils.tsx';

export type Worker = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  availability?: any;
  active?: boolean;
  user_role?: 'worker' | 'admin';
  must_change_password?: boolean;
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

export async function getWorkerByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    console.error(`Error fetching worker by email: ${error.message}`);
    return null;
  }
}

export async function addWorker(worker: Worker) {
  try {
    // Create a random password for the new user
    const password = generateRandomPassword();
    
    // Create a new user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: worker.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: worker.first_name,
        last_name: worker.last_name,
        user_role: worker.user_role || 'worker'
      }
    });
    
    if (authError) throw authError;
    
    // Add the worker to the workers table
    const { data, error } = await supabase
      .from('workers')
      .insert([{
        ...worker,
        must_change_password: true,
        user_id: authData.user.id
      }])
      .select()
      .single();
    
    if (error) {
      // If there was an error adding the worker, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }
    
    toast.success(`Worker added successfully. Temporary password: ${password}`);
    // In a production environment, you would email this password to the worker
    // instead of displaying it in a toast
    
    return data;
  } catch (error: any) {
    toast.error(`Error adding worker: ${error.message}`);
    return null;
  }
}

export async function updateWorker(id: string, updates: Partial<Worker>) {
  try {
    // Get the current worker data
    const { data: currentWorker, error: fetchError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update the worker in the database
    const { data, error } = await supabase
      .from('workers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // If the email was changed, update the auth user email
    if (updates.email && updates.email !== currentWorker.email && currentWorker.user_id) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        currentWorker.user_id,
        { email: updates.email }
      );
      
      if (authError) throw authError;
    }
    
    // If user_role was changed, update the user metadata
    if (updates.user_role && currentWorker.user_id) {
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        currentWorker.user_id,
        { 
          user_metadata: { 
            user_role: updates.user_role,
            first_name: updates.first_name || currentWorker.first_name,
            last_name: updates.last_name || currentWorker.last_name
          } 
        }
      );
      
      if (metadataError) throw metadataError;
    }
    
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
    
    // Get the worker to find the user_id
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (workerError) throw workerError;
    
    // Delete the worker from the database
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Delete the auth user if user_id exists
    if (worker.user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(worker.user_id);
      if (authError) {
        console.error(`Failed to delete auth user: ${authError.message}`);
        // Continue anyway since the worker was deleted
      }
    }
    
    toast.success('Worker deleted successfully');
    return true;
  } catch (error: any) {
    toast.error(`Error deleting worker: ${error.message}`);
    return false;
  }
}

export async function resetWorkerPassword(workerId: string) {
  try {
    // Get the worker to find the user_id
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('user_id, email')
      .eq('id', workerId)
      .single();
    
    if (workerError) throw workerError;
    
    if (!worker.user_id) {
      throw new Error('Worker does not have an associated user account');
    }
    
    // Generate a new random password
    const newPassword = generateRandomPassword();
    
    // Update the user's password
    const { error: authError } = await supabase.auth.admin.updateUserById(
      worker.user_id,
      { password: newPassword }
    );
    
    if (authError) throw authError;
    
    // Set must_change_password to true
    const { error: updateError } = await supabase
      .from('workers')
      .update({ must_change_password: true })
      .eq('id', workerId);
    
    if (updateError) throw updateError;
    
    toast.success(`Password reset successfully. New temporary password: ${newPassword}`);
    // In a production environment, you would email this password to the worker
    // instead of displaying it in a toast
    
    return true;
  } catch (error: any) {
    toast.error(`Error resetting password: ${error.message}`);
    return false;
  }
}

export async function changePassword(oldPassword: string, newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    // Update the must_change_password flag for the worker
    const { data: user } = await supabase.auth.getUser();
    if (user && user.user) {
      const { error: updateError } = await supabase
        .from('workers')
        .update({ must_change_password: false })
        .eq('user_id', user.user.id);
      
      if (updateError) throw updateError;
    }
    
    toast.success('Password changed successfully');
    return true;
  } catch (error: any) {
    toast.error(`Error changing password: ${error.message}`);
    return false;
  }
}