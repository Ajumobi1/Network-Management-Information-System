import { getApiClient } from '../api/client';
import { useMockData } from '../lib/runtime';
import {
  isProtectedNmisTable,
  secureContractUnavailable,
  trustedOperationRequired,
} from '../lib/security/secureContracts';
import { formatSupabaseError } from '../utils/api';

export { useMockData };

function assertGenericReadAllowed(table: string): void {
  if (isProtectedNmisTable(table)) {
    throw secureContractUnavailable(`read:${table}`, `Direct browser reads of protected table '${table}' are unavailable; use its named secure contract.`);
  }
}

function assertGenericMutationAllowed(table: string, operation: string): void {
  if (isProtectedNmisTable(table)) {
    throw trustedOperationRequired(`${operation}:${table}`);
  }
}

/**
 * Generic helpers are retained only for nonprotected tables. Protected NMIS
 * tables must be reached through typed repository adapters and named contracts.
 */
export async function fetchTable<T>(table: string, order?: { column: string; ascending?: boolean }): Promise<T[]> {
  assertGenericReadAllowed(table);
  const supabase = getApiClient();
  const query = supabase.from(table).select('*');

  if (order) {
    query.order(order.column, { ascending: order.ascending ?? true });
  }

  const { data, error } = await query;
  if (error) throw formatSupabaseError(error);
  return data as T[];
}

export async function fetchSingle<T>(table: string, column: string, value: string): Promise<T> {
  assertGenericReadAllowed(table);
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).select('*').eq(column, value).single();
  if (error) throw formatSupabaseError(error);
  return data as T;
}

export async function insertRow<T>(table: string, payload: Partial<T>): Promise<T> {
  assertGenericMutationAllowed(table, 'insert');
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).insert(payload as Record<string, unknown>).single();
  if (error) throw formatSupabaseError(error);
  return data as T;
}

export async function updateRow<T>(table: string, id: string, payload: Partial<T>): Promise<T> {
  assertGenericMutationAllowed(table, 'update');
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).update(payload as Record<string, unknown>).eq('id', id).single();
  if (error) throw formatSupabaseError(error);
  return data as T;
}

export async function upsertRow<T>(table: string, payload: Partial<T>): Promise<T> {
  assertGenericMutationAllowed(table, 'upsert');
  const supabase = getApiClient();
  const { data, error } = await supabase.from(table).upsert(payload as Record<string, unknown>).single();
  if (error) throw formatSupabaseError(error);
  return data as T;
}

export async function deleteRow(table: string, id: string): Promise<boolean> {
  assertGenericMutationAllowed(table, 'delete');
  const supabase = getApiClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw formatSupabaseError(error);
  return true;
}
