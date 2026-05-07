import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Nếu người dùng vô tình nhập postgresql:// vào VITE_SUPABASE_URL, tự động chuyển đổi thành https://
if (supabaseUrl.startsWith('postgresql://')) {
  const match = supabaseUrl.match(/postgres\.([^:]+)/);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  } else {
    supabaseUrl = 'https://placeholder.supabase.co';
  }
} else if (!supabaseUrl) {
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
