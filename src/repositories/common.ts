import { getApiClient } from '../api/client';
import { formatSupabaseError } from '../utils/api';

export const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export async function fetchTable<T>(table: string, order?: { column: string; ascending?: boolean }): Promise<T[]> {
  const supabase = getApiClient();
  const query = supabase.from(table).select('*');

  if (order) {
    query.order(order.column, { ascending: order.ascending ?? true });
  }

  const { data, error } = await query;

  if (error) {
    throw formatSupabaseError(error);
  }

  return data as T[];
}

export async function fetchSingle<T>(table: string, column: string, value: string): Promise<T> {
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).select('*').eq(column, value).single();

  if (error) {
    throw formatSupabaseError(error);
  }

  return data as T;
}

export async function insertRow<T>(table: string, payload: Partial<T>): Promise<T> {
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).insert(payload as Record<string, unknown>).single();

  if (error) {
    throw formatSupabaseError(error);
  }

  return data as T;
}

export async function updateRow<T>(table: string, id: string, payload: Partial<T>): Promise<T> {
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).update(payload as Record<string, unknown>).eq('id', id).single();

  if (error) {
    throw formatSupabaseError(error);
  }

  return data as T;
}

export async function upsertRow<T>(table: string, payload: Partial<T>): Promise<T> {
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).upsert(payload as Record<string, unknown>).single();

  if (error) {
    throw formatSupabaseError(error);
  }

  return data as T;
}

export async function deleteRow(table: string, id: string): Promise<boolean> {
  const supabase = getApiClient();
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) {
    throw formatSupabaseError(error);
  }

  return true;
}
