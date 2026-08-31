/**
 * Supabase / PostgreSQL Client Configuration & Environment Adapter
 * 
 * FleetTrack 2.0 uses a clean repository abstraction.
 * If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present, queries map to Supabase PostgreSQL.
 * Otherwise, the repository runs seamlessly on the persistent local/offline storage cache with full RLS simulation.
 */

export interface SupabaseConfig {
  url: string | null;
  anonKey: string | null;
  isConfigured: boolean;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const metaEnv = (import.meta as any).env || {};
  const url = metaEnv.VITE_SUPABASE_URL || null;
  const anonKey = metaEnv.VITE_SUPABASE_ANON_KEY || null;

  return {
    url,
    anonKey,
    isConfigured: !!(url && anonKey)
  };
};

export const getDatabaseConnectionInfo = () => {
  const config = getSupabaseConfig();
  return {
    backend: config.isConfigured ? 'supabase_postgresql' : 'offline_local_storage',
    status: config.isConfigured ? 'Connected (Supabase Cloud)' : 'Offline Local Storage (Ready for Cloud Sync)',
    isConfigured: config.isConfigured,
    url: config.url ? `${config.url.slice(0, 15)}...` : 'Not configured (using local tenant store)',
    schemaVersion: '2.0.0-gcc-multitenant'
  };
};
