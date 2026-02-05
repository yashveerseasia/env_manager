'use client';

import { useState, useMemo, useEffect } from 'react';
import type { EnvShareRecord, ShareStatus } from '@/types/share';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

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
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(shares.length / rowsPerPage)),
    [shares.length, rowsPerPage]
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
  const effectivePage = Math.min(page, totalPages);
  const paginatedShares = useMemo(() => {
    const start = (effectivePage - 1) * rowsPerPage;
    return shares.slice(start, start + rowsPerPage);
  }, [shares, effectivePage, rowsPerPage]);
  const startRow = shares.length === 0 ? 0 : (effectivePage - 1) * rowsPerPage + 1;
  const endRow = Math.min(effectivePage * rowsPerPage, shares.length);

  if (!shares.length) {
    return (
      <p className="text-sm text-gray-500">
        No share links yet. Create one to securely share this environment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-14 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                S.No.
              </th>
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
            {paginatedShares.map((share, index) => {
              const status = getStatus(share);
              const sNo = startRow + index;
              return (
                <tr key={share.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-gray-700">
                    {sNo}
                  </td>
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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            Showing {startRow}–{endRow} of {shares.length}
          </span>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Rows per page:
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {ROWS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={effectivePage <= 1}
            className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-700">
            Page {effectivePage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={effectivePage >= totalPages}
            className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

