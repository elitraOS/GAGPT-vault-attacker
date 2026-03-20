import React from 'react';
import { VAULT_ADDRESS, CHAIN_NAME, truncateAddress } from '../lib/vault-config';

interface VaultInfoProps {
  /** Override the vault address (optional, defaults to env/config) */
  vaultAddress?: string;
  /** Override the chain name (optional, defaults to env/config) */
  chainName?: string;
}

const VaultInfo: React.FC<VaultInfoProps> = ({
  vaultAddress = VAULT_ADDRESS,
  chainName = CHAIN_NAME,
}) => {
  const truncated = truncateAddress(vaultAddress);

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
      <span className="flex items-center gap-1">
        <span className="text-gray-500">Chain:</span>
        <span className="font-medium text-gray-600">{chainName}</span>
      </span>
      <span className="text-gray-300">·</span>
      <span className="flex items-center gap-1">
        <span className="text-gray-500">Vault:</span>
        <span
          className="font-mono font-medium text-gray-600"
          title={vaultAddress}
        >
          {truncated}
        </span>
      </span>
    </div>
  );
};

export default VaultInfo;
