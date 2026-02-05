'use client';

import type { EnvShareRecord, ShareStatus } from '@/types/share';

interface ShareLinksTableProps {
  shares: EnvShareRecord[];
  onCopy: (share: EnvShareRecord) => void;
  onRevoke: (share: EnvShareRecord) => void;
}

const getStatus = (share: EnvShareRecord): ShareStatus => {
  if (!share.is_active) {
    return 'revoked';
  }
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return 'expired';
  }
  return 'active';
};

const statusBadgeClass = (status: ShareStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'expired':
      return 'bg-yellow-100 text-yellow-800';
    case 'revoked':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ShareLinksTable({
  shares,
  onCopy,
  onRevoke,
}: ShareLinksTableProps) {
  if (!shares.length) {
    return (
      <p className="text-sm text-gray-500">
        No share links yet. Create one to securely share this environment.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Created At
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Expires At
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Views
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Downloads
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              One-time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {shares.map((share) => {
            const status = getStatus(share);
            return (
              <tr key={share.id}>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {new Date(share.created_at).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {share.expires_at
                    ? new Date(share.expires_at).toLocaleString()
                    : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {share.view_count}/{share.max_views || '∞'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {share.download_count}/{share.max_downloads || '∞'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {share.one_time ? 'Yes' : 'No'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                      status,
                    )}`}
                  >
                    {status === 'active'
                      ? 'Active'
                      : status === 'expired'
                      ? 'Expired'
                      : 'Revoked'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onCopy(share)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Copy Link
                    </button>
                    <button
                      type="button"
                      disabled={status !== 'active'}
                      onClick={() => onRevoke(share)}
                      className="rounded-md border border-red-600 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-white"
                    >
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

