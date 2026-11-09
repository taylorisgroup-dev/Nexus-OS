/**
 * NEXUS OS — Client Supabase & Couche d'accès aux données
 * Gestion fluide : Connexion Supabase Cloud avec fallback résilient local
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.info('[NEXUS OS] Supabase client initialized successfully.');
  } catch (err) {
    console.warn('[NEXUS OS] Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
} else {
  console.info(
    '[NEXUS OS] Supabase credentials not yet supplied in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Using resilient local operational store.'
  );
}

export const supabase = supabaseInstance;

/**
 * Storage Local Persistant de secours pour les tests et le développement local
 * Garantit que l'utilisateur peut tester l'intégralité des flux sans interruption
 */
class LocalStoreAdapter {
  private getStorageKey(tableName: string): string {
    return `nexus_store_${tableName}`;
  }

  getTable<T>(tableName: string): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(tableName));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  setTable<T>(tableName: string, items: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(items));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  insert<T extends { id?: string }>(tableName: string, item: T): T {
    const list = this.getTable<T>(tableName);
    const withId = {
      ...item,
      id: item.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: (item as any).created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(withId);
    this.setTable(tableName, list);
    return withId;
  }

  update<T extends { id: string }>(tableName: string, id: string, updates: Partial<T>): T | null {
    const list = this.getTable<T>(tableName);
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const updated = {
      ...list[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[idx] = updated;
    this.setTable(tableName, list);
    return updated;
  }

  delete(tableName: string, id: string): boolean {
    const list = this.getTable<{ id: string }>(tableName);
    const filtered = list.filter((i) => i.id !== id);
    this.setTable(tableName, filtered);
    return filtered.length < list.length;
  }
}

export const localStore = new LocalStoreAdapter();
