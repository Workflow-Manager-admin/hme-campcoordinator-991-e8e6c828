import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
// Create and export a Supabase client, using public project credentials
const SUPABASE_URL = 'https://lbnoqrqqulazytkwhlqa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxibm9xcnFxdWxhenl0a3dobHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDcwMTEsImV4cCI6MjA2NzU4MzAxMX0.JzuORjfttLXalSmVaiUUd5k6kmQI8uP0tG35tteM4kU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
