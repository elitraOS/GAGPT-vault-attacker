import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { useVaultState } from '../hooks/useVaultState';
import { StatusBar } from '../components/StatusBar';
import { MetricCard } from '../components/MetricCard';
import { FeeTable } from '../components/FeeTable';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import VaultInfo from '../components/VaultInfo';

const REFRESH_INTERVAL = 30;

export function VaultDashboard() {
  const { data, isLoading, isError, error, dataUpdatedAt, isFetching } = useVaultState();
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  useEffect(() => {
    setCountdown(REFRESH_INTERVAL);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ElitraVault Dashboard</h1>
          <VaultInfo />
          <span className="text-sm text-gray-400">
            {countdown === 0 ? 'Refreshing...' : `Next refresh in ${countdown}s`}
          </span>
        </div>

        {/* Content */}
        {isLoading && !data ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <p className="font-semibold">Failed to load vault state</p>
            <p className="text-sm mt-1">{error?.message ?? 'Unknown error'}</p>
            <p className="text-sm mt-2 text-red-500">Backend may be unreachable</p>
          </div>
        ) : data ? (
          <>
            <StatusBar
              vaultAddress={data.vaultAddress}
              chainId={data.chainId}
              paused={data.paused}
              navFresh={data.navFresh}
              lastUpdated={data.lastUpdated}
              isFetching={isFetching}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="Price Per Share"
                value={formatUnits(BigInt(data.pricePerShare), 6)}
                subtitle="USDC"
              />
              <MetricCard
                label="Total Assets"
                value={formatUnits(BigInt(data.totalAssets), 6)}
                subtitle="USDC"
              />
              <MetricCard
                label="Total Supply"
                value={formatUnits(BigInt(data.totalSupply), 18)}
                subtitle="shares"
              />
              <MetricCard
                label="Available Balance"
                value={formatUnits(BigInt(data.availableBalance), 6)}
                subtitle="USDC"
              />
              <MetricCard
                label="Pending Redeems"
                value={formatUnits(BigInt(data.totalPendingAssets), 6)}
                subtitle="USDC"
              />
              <MetricCard
                label="Pending Fees"
                value={formatUnits(BigInt(data.pendingFees), 6)}
                subtitle="USDC"
              />
            </div>

            <FeeTable
              feeOnDeposit={data.feeOnDeposit}
              feeOnWithdraw={data.feeOnWithdraw}
              feeOnQueuedRedeem={data.feeOnQueuedRedeem}
              feeRecipient={data.feeRecipient}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
