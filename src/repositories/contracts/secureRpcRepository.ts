import { getApiClient } from '../../api/client';
import {
  accessRestricted,
  secureContractUnavailable,
  SecureContractError,
} from '../../lib/security/secureContracts';

type RpcError = { code?: string; message?: string } | null;
type RpcClient = {
  rpc: <T>(functionName: string, args?: Record<string, unknown>) => Promise<{ data: T | null; error: RpcError }>;
};

function mapRpcError(contract: string, error: RpcError): SecureContractError {
  const code = error?.code ?? '';
  const message = error?.message ?? '';
  const normalized = `${code} ${message}`.toLowerCase();

  if (code === '42501' || normalized.includes('permission denied') || normalized.includes('not allowed')) {
    return accessRestricted(contract);
  }

  if (code === '42883' || code === 'PGRST202' || normalized.includes('does not exist') || normalized.includes('could not find the function')) {
    return secureContractUnavailable(contract);
  }

  return secureContractUnavailable(contract, `Secure contract '${contract}' could not be used in the current environment.`);
}

/**
 * Browser callers invoke only named, typed database contracts through this
 * adapter. No caller may use it as a generic table query or mutation surface.
 */
export async function invokeSecureRpc<T>(contract: string, args: Record<string, unknown> = {}): Promise<T> {
  const client = getApiClient() as unknown as RpcClient;
  const { data, error } = await client.rpc<T>(contract, args);
  if (error) throw mapRpcError(contract, error);
  if (data === null) throw secureContractUnavailable(contract, `Secure contract '${contract}' returned no data.`);
  return data;
}
