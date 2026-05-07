import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';

@Injectable()
export class SupabaseService {
  get client() {
    return supabase;
  }
}
