
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryRecord } from '../types';

/**
 * Supabase Service
 * Handles online data persistence with defensive initialization.
 */

let supabaseInstance: SupabaseClient | null = null;

const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  // Environment variables might be empty strings or the string "undefined" in some contexts
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  const isInvalid = (val: string | undefined) => !val || val === "undefined" || val === "" || val === "null";

  if (isInvalid(url) || isInvalid(key)) {
    console.warn("Supabase credentials missing or invalid. App will operate in Local Storage mode.");
    return null;
  }
  
  try {
    // Only call createClient if we have valid-looking strings
    supabaseInstance = createClient(url!, key!);
    return supabaseInstance;
  } catch (err) {
    console.error("Critical: Failed to initialize Supabase client:", err);
    return null;
  }
};

export class SupabaseService {
  private static STORAGE_KEY_ID = 'tissue_roll_sync_id';

  /** Checks if the cloud service is actually configured and reachable */
  static isConfigured(): boolean {
    return getSupabase() !== null;
  }

  static getSyncId(): string {
    let id = localStorage.getItem(this.STORAGE_KEY_ID);
    if (!id) {
      id = 'TR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem(this.STORAGE_KEY_ID, id);
    }
    return id;
  }

  static setSyncId(id: string) {
    localStorage.setItem(this.STORAGE_KEY_ID, id.toUpperCase().trim());
  }

  static async pushData(records: InventoryRecord[]): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    
    const sync_id = this.getSyncId();
    try {
      const { error } = await supabase
        .from('inventory_sync')
        .upsert({ 
          sync_id, 
          records, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'sync_id' });
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase push error:', err);
      return false;
    }
  }

  static async pullData(): Promise<InventoryRecord[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const sync_id = this.getSyncId();
    try {
      const { data, error } = await supabase
        .from('inventory_sync')
        .select('records')
        .eq('sync_id', sync_id)
        .maybeSingle(); 
      
      if (error) throw error;
      return data ? (data.records as InventoryRecord[]) : null;
    } catch (err) {
      console.error('Supabase pull error:', err);
      return null;
    }
  }
}
