import { useQuery } from '@tanstack/react-query';
import type { VaultState } from '../types/vault';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function fetchVaultState(): Promise<VaultState> {
  const res = await fetch(`${API_URL}/vault/state`);
  if (!res.ok) {
    throw new Error(`Failed to fetch vault state: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { data: VaultState };
  return json.data;
}

export function useVaultState() {
  const { data, isLoading, isError, error, dataUpdatedAt, isFetching } = useQuery<VaultState, Error>({
    queryKey: ['vaultState'],
    queryFn: fetchVaultState,
    refetchInterval: 30_000,
  });

  return { data, isLoading, isError, error, dataUpdatedAt, isFetching };
}
