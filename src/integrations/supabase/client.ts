// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vdgagzvwjqehavroaipr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZ2FnenZ3anFlaGF2cm9haXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTM1NjYsImV4cCI6MjA2NzQ2OTU2Nn0.tWt5rIhIs5Eaha65T17g2fxUw0g2eEb3CrDS5R0bLro";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});