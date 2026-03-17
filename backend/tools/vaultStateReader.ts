/**
 * vaultStateReader.ts
 *
 * Read-only agent tool that fetches the full live state of an ElitraVault
 * (ERC4626) contract from Sei EVM RPC. No wallet required — all calls are
 * pure `eth_call` reads via viem's createPublicClient.
 *
 * Usage:
 *   import { readVaultState } from './tools/vaultStateReader';
 *   const state = await readVaultState();
 */

import { createPublicClient, http, type Address, type PublicClient } from 'viem';
import { defineChain } from 'viem';
import { loadConfig } from '../config/loader';
import type { VaultState } from '../src/types/vault';
import ElitraVaultAbi from '../abis/ElitraVault.json';

// ── Sei Mainnet chain definition ───────────────────────────────────────────────
// viem ships `sei` from `viem/chains` but we pin it explicitly for clarity
// and to avoid version mismatch surprises.
const seiMainnet = defineChain({
  id: 1329,
  name: 'Sei Network',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc.sei-apis.com'] },
  },
  blockExplorers: {
    default: { name: 'Seitrace', url: 'https://seitrace.com' },
  },
});

// ── Internal helpers ───────────────────────────────────────────────────────────

/**
 * Build a viem PublicClient pointed at the configured RPC.
 * The transport uses a 15-second timeout and 3 retries to handle
 * transient connectivity issues gracefully.
 */
function buildPublicClient(rpcUrl: string): PublicClient {
  return createPublicClient({
    chain: seiMainnet,
    transport: http(rpcUrl, {
      timeout: 15_000,
      retryCount: 3,
      retryDelay: 1_000,
    }),
  });
}

/**
 * Read a single view function from the vault contract.
 * Wraps readContract with explicit casting to keep strict TypeScript happy.
 */
async function readVault<T>(
  client: PublicClient,
  vaultAddress: Address,
  functionName: string,
  args?: readonly unknown[],
): Promise<T> {
  const result = await client.readContract({
    address: vaultAddress,
    abi: ElitraVaultAbi,
    functionName,
    ...(args ? { args } : {}),
  });
  return result as T;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetches the complete live state of the configured ElitraVault.
 *
 * All on-chain reads are parallelised with Promise.all to minimise latency.
 * bigint values are serialised as decimal strings for JSON safety.
 *
 * @throws {Error} with a descriptive message on RPC failure or bad config.
 */
export async function readVaultState(): Promise<VaultState> {
  // 1. Load + validate config (throws immediately with clear message on bad env)
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    throw new Error(
      `Configuration error — cannot read vault state: ${(err as Error).message}`,
    );
  }

  const vaultAddress = config.VAULT_ADDRESS as Address;
  const client = buildPublicClient(config.RPC_URL);

  // 2. Fire all reads in parallel
  let results: [
    bigint, // totalAssets
    bigint, // totalSupply
    bigint, // pricePerShare (convertToAssets(1e18))
    bigint, // availableBalance
    bigint, // aggregatedUnderlyingBalances
    bigint, // totalPendingAssets
    bigint, // lastTimestampUpdated
    bigint, // navFreshnessThreshold
    boolean, // isPaused
    bigint, // feeOnDeposit
    bigint, // feeOnWithdraw
    bigint, // feeOnQueuedRedeem
    string, // feeRecipient
    bigint, // pendingFees
  ];

  try {
    results = await Promise.all([
      readVault<bigint>(client, vaultAddress, 'totalAssets'),
      readVault<bigint>(client, vaultAddress, 'totalSupply'),
      readVault<bigint>(client, vaultAddress, 'convertToAssets', [10n ** 18n]),
      readVault<bigint>(client, vaultAddress, 'getAvailableBalance'),
      readVault<bigint>(client, vaultAddress, 'aggregatedUnderlyingBalances'),
      readVault<bigint>(client, vaultAddress, 'totalPendingAssets'),
      readVault<bigint>(client, vaultAddress, 'lastTimestampUpdated'),
      readVault<bigint>(client, vaultAddress, 'navFreshnessThreshold'),
      readVault<boolean>(client, vaultAddress, 'paused'),
      readVault<bigint>(client, vaultAddress, 'feeOnDeposit'),
      readVault<bigint>(client, vaultAddress, 'feeOnWithdraw'),
      readVault<bigint>(client, vaultAddress, 'feeOnQueuedRedeem'),
      readVault<string>(client, vaultAddress, 'feeRecipient'),
      readVault<bigint>(client, vaultAddress, 'pendingFees'),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `RPC read failed for vault ${vaultAddress} at ${config.RPC_URL}: ${message}`,
    );
  }

  const [
    totalAssets,
    totalSupply,
    pricePerShare,
    availableBalance,
    aggregatedUnderlyingBalances,
    totalPendingAssets,
    lastTimestampUpdatedRaw,
    navFreshnessThresholdRaw,
    isPaused,
    feeOnDeposit,
    feeOnWithdraw,
    feeOnQueuedRedeem,
    feeRecipient,
    pendingFees,
  ] = results;

  // 3. Derive NAV freshness metrics
  const snapshotTimestamp = Math.floor(Date.now() / 1000);
  const lastTimestampUpdated = Number(lastTimestampUpdatedRaw);
  const navFreshnessThreshold = Number(navFreshnessThresholdRaw);
  const navAgeSeconds = snapshotTimestamp - lastTimestampUpdated;
  const navIsFresh = navFreshnessThreshold > 0
    ? navAgeSeconds <= navFreshnessThreshold
    : true; // if threshold not set, consider fresh

  // 4. Build structured response (bigints as decimal strings)
  return {
    vaultAddress,
    chainId: seiMainnet.id,
    snapshotTimestamp,

    totalAssets: totalAssets.toString(),
    totalSupply: totalSupply.toString(),
    pricePerShare: pricePerShare.toString(),

    availableBalance: availableBalance.toString(),
    aggregatedUnderlyingBalances: aggregatedUnderlyingBalances.toString(),
    totalPendingAssets: totalPendingAssets.toString(),

    lastTimestampUpdated,
    navFreshnessThreshold,
    navAgeSeconds,
    navIsFresh,

    isPaused,

    feeOnDeposit: feeOnDeposit.toString(),
    feeOnWithdraw: feeOnWithdraw.toString(),
    feeOnQueuedRedeem: feeOnQueuedRedeem.toString(),
    feeRecipient,
    pendingFees: pendingFees.toString(),
  };
}
