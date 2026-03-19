interface FeeTableProps {
  feeOnDeposit: string;
  feeOnWithdraw: string;
  feeOnQueuedRedeem: string;
  feeRecipient: string;
}

function feeToPercent(feeValue: string): string {
  return (Number(BigInt(feeValue)) / 1e18 * 100).toFixed(4);
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function FeeTable({ feeOnDeposit, feeOnWithdraw, feeOnQueuedRedeem, feeRecipient }: FeeTableProps) {
  const rows = [
    { label: 'Deposit Fee', value: `${feeToPercent(feeOnDeposit)}%` },
    { label: 'Withdraw Fee', value: `${feeToPercent(feeOnWithdraw)}%` },
    { label: 'Queued Redeem Fee', value: `${feeToPercent(feeOnQueuedRedeem)}%` },
    { label: 'Fee Recipient', value: truncateAddress(feeRecipient) },
  ];

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Fee Configuration</h3>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-5 py-3 text-gray-500">{row.label}</td>
              <td className="px-5 py-3 text-gray-900 font-mono text-right">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
