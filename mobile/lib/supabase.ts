import 'react-native-url-polyfill/dist/setup';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://cnawnprwdcfmyswqolsu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYXducHJ3ZGNmbXlzd3FvbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzAwMDgsImV4cCI6MjA4MDE0NjAwOH0.0vbdtje7zHrSPOE9sKT3DimD2EO6o9MBpP2IMRqfg9c';

// SecureStore adapter for Supabase auth
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

