import { createClient } from '@supabase/supabase-js';

interface ImportMeta {
  env: {
	VITE_SUPABASE_URL: string;
	VITE_SUPABASE_ANON_KEY: string;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
/*
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);*/