import React from 'react';

interface StatusBarProps {
  vaultAddress: string;
  chainId: number;
  paused: boolean;
  navFresh: boolean;
  lastUpdated: string; // ISO string
  isFetching: boolean;
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  return `${Math.floor(diffSec / 86400)} day ago`;
}

export function StatusBar({ vaultAddress, chainId, paused, navFresh, lastUpdated, isFetching }: StatusBarProps) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(vaultAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl shadow p-4 mb-6">
      {/* Vault address */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-mono">{truncateAddress(vaultAddress)}</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Chain */}
      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
        Sei Mainnet ({chainId})
      </span>

      {/* Paused badge */}
      {paused ? (
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Paused</span>
      ) : (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
      )}

      {/* NAV freshness */}
      {navFresh ? (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Fresh</span>
      ) : (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Stale</span>
      )}

      {/* Last updated */}
      <span className="text-xs text-gray-400 ml-auto">
        Updated {relativeTime(lastUpdated)}
      </span>

      {/* Fetching spinner */}
      {isFetching && (
        <svg
          className="animate-spin h-4 w-4 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
    </div>
  );
}
