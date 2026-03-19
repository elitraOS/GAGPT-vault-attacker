/**
 * Structured vault state returned by the vaultStateReader tool.
 * All bigint values are serialised as decimal strings in JSON responses
 * because JSON does not natively support 256-bit integers.
 */
export interface VaultState {
  /** ElitraVault contract address that was queried */
  vaultAddress: string;

  /** Chain ID of the network (1329 = Sei mainnet) */
  chainId: number;

  /** Unix timestamp (seconds) when this snapshot was taken */
  snapshotTimestamp: number;

  // ── ERC-4626 core ──────────────────────────────────────────────────────────

  /** Total underlying assets managed by the vault (raw, asset decimals) */
  totalAssets: string;

  /** Total vault shares outstanding (raw, 18 decimals) */
  totalSupply: string;

  /** Price per share: convertToAssets(1e18) — how many asset units 1 full share is worth */
  pricePerShare: string;

  // ── Liquidity ─────────────────────────────────────────────────────────────

  /** Assets available for immediate withdrawal (vault liquid balance minus pending redeems) */
  availableBalance: string;

  /** Assets currently sitting in external protocols (aggregated) */
  aggregatedUnderlyingBalances: string;

  /** Total assets queued for pending redemptions */
  totalPendingAssets: string;

  // ── NAV freshness ─────────────────────────────────────────────────────────

  /** Unix timestamp (seconds) of the last on-chain NAV / balance update */
  lastTimestampUpdated: number;

  /** Configured max staleness window in seconds before vault treats NAV as stale */
  navFreshnessThreshold: number;

  /** Age of the current NAV in seconds (snapshotTimestamp − lastTimestampUpdated) */
  navAgeSeconds: number;

  /** Whether the NAV is considered fresh (navAgeSeconds ≤ navFreshnessThreshold) */
  navIsFresh: boolean;

  // ── Pause state ───────────────────────────────────────────────────────────

  /** Whether the vault is currently paused (deposits/redeems blocked) */
  isPaused: boolean;

  // ── Fee configuration ─────────────────────────────────────────────────────

  /** Flat deposit fee (1e18 = 100%) */
  feeOnDeposit: string;

  /** Flat withdrawal fee (1e18 = 100%) */
  feeOnWithdraw: string;

  /** Flat queued-redeem fee (1e18 = 100%) */
  feeOnQueuedRedeem: string;

  /** Address that receives protocol/manager fees */
  feeRecipient: string;

  /** Accumulated but unclaimed fees (asset units) */
  pendingFees: string;
}

/**
 * Wire format for a single vault-state API response.
 * Wraps VaultState with a success envelope.
 */
export interface VaultStateResponse {
  success: true;
  data: VaultState;
}

/**
 * Wire format for error responses.
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}
