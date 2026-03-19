/**
 * vaultStateReader.test.ts
 *
 * Unit/integration tests for the vault state reader tool.
 * Uses vitest + a mocked viem PublicClient to confirm correct ABI decoding
 * and data transformation without hitting a live RPC.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock viem ────────────────────────────────────────────────────────────────
// We intercept createPublicClient so no real RPC calls are made.
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(),
  };
});

// ── Mock config loader ────────────────────────────────────────────────────────
vi.mock('../config/loader', () => ({
  loadConfig: vi.fn(() => ({
    RPC_URL: 'https://evm-rpc.sei-apis.com',
    VAULT_ADDRESS: '0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef',
    PORT: 3000,
    NODE_ENV: 'test',
  })),
  _resetConfig: vi.fn(),
}));

import { createPublicClient } from 'viem';
import { readVaultState } from '../tools/vaultStateReader';

// ── Fixture on-chain return values ────────────────────────────────────────────
const MOCK_BLOCK_TIMESTAMP_SEC = 1_720_000_000;

// Simulate ~1.05 USD / share with 6-decimal USDC vault
const MOCK_TOTAL_ASSETS = 10_500_000n;       // 10.5 USDC (6 dec)
const MOCK_TOTAL_SUPPLY = 10n ** 18n * 10n;  // 10 shares (18 dec)
// convertToAssets(1e18) ≈ 1.05e6 (1.05 USDC per share)
const MOCK_PPS = 1_050_000n;

const MOCK_AVAILABLE_BALANCE = 5_000_000n;
const MOCK_AGGREGATED = 5_500_000n;
const MOCK_TOTAL_PENDING = 0n;
const MOCK_LAST_TS = BigInt(MOCK_BLOCK_TIMESTAMP_SEC - 60); // 60s ago
const MOCK_FRESHNESS_THRESHOLD = 3600n; // 1 hour
const MOCK_PAUSED = false;
const MOCK_FEE_DEPOSIT = 1_000_000_000_000_000n; // 0.1% (1e18 = 100%)
const MOCK_FEE_WITHDRAW = 1_000_000_000_000_000n;
const MOCK_FEE_QUEUED = 2_000_000_000_000_000n; // 0.2%
const MOCK_FEE_RECIPIENT = '0x1234567890123456789012345678901234567890';
const MOCK_PENDING_FEES = 500n;

/**
 * Build a mock readContract that returns fixture values by functionName.
 */
function buildMockReadContract() {
  return vi.fn(({ functionName }: { functionName: string }) => {
    const map: Record<string, unknown> = {
      totalAssets: MOCK_TOTAL_ASSETS,
      totalSupply: MOCK_TOTAL_SUPPLY,
      convertToAssets: MOCK_PPS,
      getAvailableBalance: MOCK_AVAILABLE_BALANCE,
      aggregatedUnderlyingBalances: MOCK_AGGREGATED,
      totalPendingAssets: MOCK_TOTAL_PENDING,
      lastTimestampUpdated: MOCK_LAST_TS,
      navFreshnessThreshold: MOCK_FRESHNESS_THRESHOLD,
      paused: MOCK_PAUSED,
      feeOnDeposit: MOCK_FEE_DEPOSIT,
      feeOnWithdraw: MOCK_FEE_WITHDRAW,
      feeOnQueuedRedeem: MOCK_FEE_QUEUED,
      feeRecipient: MOCK_FEE_RECIPIENT,
      pendingFees: MOCK_PENDING_FEES,
    };
    if (!(functionName in map)) {
      throw new Error(`Unexpected readContract call: ${functionName}`);
    }
    return Promise.resolve(map[functionName]);
  });
}

describe('readVaultState', () => {
  let mockReadContract: ReturnType<typeof buildMockReadContract>;

  beforeEach(() => {
    mockReadContract = buildMockReadContract();
    vi.mocked(createPublicClient).mockReturnValue({
      readContract: mockReadContract,
    } as unknown as ReturnType<typeof createPublicClient>);

    // Pin wall-clock so navAgeSeconds is deterministic
    vi.setSystemTime(new Date(MOCK_BLOCK_TIMESTAMP_SEC * 1000));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns all required vault state fields', async () => {
    const state = await readVaultState();

    expect(state).toMatchObject({
      vaultAddress: '0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef',
      chainId: 1329,
    });
  });

  it('serialises bigint values as decimal strings', async () => {
    const state = await readVaultState();

    expect(state.totalAssets).toBe(MOCK_TOTAL_ASSETS.toString());
    expect(state.totalSupply).toBe(MOCK_TOTAL_SUPPLY.toString());
    expect(state.pricePerShare).toBe(MOCK_PPS.toString());
    expect(state.availableBalance).toBe(MOCK_AVAILABLE_BALANCE.toString());
    expect(state.aggregatedUnderlyingBalances).toBe(MOCK_AGGREGATED.toString());
    expect(state.totalPendingAssets).toBe(MOCK_TOTAL_PENDING.toString());
    expect(state.feeOnDeposit).toBe(MOCK_FEE_DEPOSIT.toString());
    expect(state.feeOnWithdraw).toBe(MOCK_FEE_WITHDRAW.toString());
    expect(state.feeOnQueuedRedeem).toBe(MOCK_FEE_QUEUED.toString());
    expect(state.pendingFees).toBe(MOCK_PENDING_FEES.toString());
  });

  it('correctly computes NAV freshness (60s age, 3600s threshold → fresh)', async () => {
    const state = await readVaultState();

    expect(state.lastTimestampUpdated).toBe(Number(MOCK_LAST_TS));
    expect(state.navFreshnessThreshold).toBe(Number(MOCK_FRESHNESS_THRESHOLD));
    expect(state.navAgeSeconds).toBe(60);
    expect(state.navIsFresh).toBe(true);
  });

  it('marks NAV as stale when age exceeds threshold', async () => {
    // Override: last update was 2 hours ago, threshold is 1 hour
    const staleTs = BigInt(MOCK_BLOCK_TIMESTAMP_SEC - 7200); // 2h ago
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'lastTimestampUpdated') return Promise.resolve(staleTs);
      if (functionName === 'navFreshnessThreshold') return Promise.resolve(3600n); // 1h
      return buildMockReadContract()({ functionName, address: '', abi: [] } as Parameters<typeof mockReadContract>[0]);
    });

    const state = await readVaultState();

    expect(state.navAgeSeconds).toBe(7200);
    expect(state.navIsFresh).toBe(false);
  });

  it('surfaces RPC errors with a descriptive message', async () => {
    vi.mocked(createPublicClient).mockReturnValue({
      readContract: vi.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as ReturnType<typeof createPublicClient>);

    await expect(readVaultState()).rejects.toThrow(/RPC read failed/);
    await expect(readVaultState()).rejects.toThrow(/connection refused/);
  });

  it('reflects the pause state correctly', async () => {
    // Override paused = true
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'paused') return Promise.resolve(true);
      return buildMockReadContract()({ functionName, address: '', abi: [] } as Parameters<typeof mockReadContract>[0]);
    });

    const state = await readVaultState();
    expect(state.isPaused).toBe(true);
  });

  it('returns the fee recipient address as a string', async () => {
    const state = await readVaultState();
    expect(state.feeRecipient).toBe(MOCK_FEE_RECIPIENT);
  });

  it('issues exactly 14 parallel readContract calls', async () => {
    await readVaultState();
    // 14 parallel reads: totalAssets, totalSupply, convertToAssets,
    // getAvailableBalance, aggregatedUnderlyingBalances, totalPendingAssets,
    // lastTimestampUpdated, navFreshnessThreshold, paused,
    // feeOnDeposit, feeOnWithdraw, feeOnQueuedRedeem, feeRecipient, pendingFees
    expect(mockReadContract).toHaveBeenCalledTimes(14);
  });
});
