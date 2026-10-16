import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Cliente para validar JWT de usuarios (usa ANON_KEY, no expone service_role)
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
