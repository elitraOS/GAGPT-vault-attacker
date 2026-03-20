// Vault configuration — values from env or hardcoded defaults
export const VAULT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000';

export const CHAIN_NAME: string =
  import.meta.env.VITE_CHAIN_NAME ?? 'Sei';

/**
 * Truncates an Ethereum address to the format: 0xABCD...1234
 */
export function truncateAddress(address: string, leading = 6, trailing = 4): string {
  if (!address || address.length < leading + trailing + 2) return address;
  return `${address.slice(0, leading)}...${address.slice(-trailing)}`;
}
