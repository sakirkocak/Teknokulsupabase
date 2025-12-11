import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://cnawnprwdcfmyswqolsu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYXducHJ3ZGNmbXlzd3FvbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzAwMDgsImV4cCI6MjA4MDE0NjAwOH0.0vbdtje7zHrSPOE9sKT3DimD2EO6o9MBpP2IMRqfg9c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

