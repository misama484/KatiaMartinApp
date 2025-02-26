interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // otras variables de entorno que necesites
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}