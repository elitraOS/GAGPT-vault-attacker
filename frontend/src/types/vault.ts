export interface VaultState {
  vaultAddress: string;
  chainId: number;
  paused: boolean;
  navFresh: boolean;
  lastUpdated: string; // ISO timestamp string
  pricePerShare: string; // decimal string, USDC 6 decimals
  totalAssets: string;   // decimal string, USDC 6 decimals
  totalSupply: string;   // decimal string, shares 18 decimals
  availableBalance: string; // decimal string, USDC 6 decimals
  totalPendingAssets: string; // decimal string, USDC 6 decimals
  pendingFees: string;   // decimal string, USDC 6 decimals
  feeOnDeposit: string;  // decimal string, 1e18 = 100%
  feeOnWithdraw: string; // decimal string, 1e18 = 100%
  feeOnQueuedRedeem: string; // decimal string, 1e18 = 100%
  feeRecipient: string;  // address string
}

export interface VaultStateResponse {
  data: VaultState;
}
