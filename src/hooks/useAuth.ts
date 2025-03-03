import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { getWorkerByEmail } from '../lib/api/workersApi';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      // Check if user needs to change password
      if (session?.user) {
        const worker = await getWorkerByEmail(session.user.email || '');
        setMustChangePassword(worker?.must_change_password || false);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // Check if user needs to change password
      if (session?.user) {
        const worker = await getWorkerByEmail(session.user.email || '');
        setMustChangePassword(worker?.must_change_password || false);
      } else {
        setMustChangePassword(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, mustChangePassword };
}

export async function signOut() {
  await supabase.auth.signOut();
}