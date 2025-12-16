import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables using optional chaining and type casting to avoid TS errors
// URL sem a barra final para garantir compatibilidade
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://clientes-supabase-igextreme.ljdnkk.easypanel.host';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);