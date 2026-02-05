'use client';

import { useState, useRef, useEffect } from 'react';
import { envShareApi } from '@/lib/api';
import type { EnvShareCreatePayload, EnvShareResponse } from '@/types/share';
import { apiErrorToMessage } from '@/utils/apiError';
import { parseIpList, validateIpList } from '@/utils/validators';

interface CreateShareModalProps {
  environmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (share: EnvShareResponse) => void;
}

export default function CreateShareModal({
  environmentId,
  isOpen,
  onClose,
  onCreated,
}: CreateShareModalProps) {
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [maxViews, setMaxViews] = useState<number>(5);
  const [maxDownloads, setMaxDownloads] = useState<number>(1);
  const [oneTime, setOneTime] = useState<boolean>(false);
  const [whitelistedIpsText, setWhitelistedIpsText] = useState('');
  const [ipError, setIpError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdShare, setCreatedShare] = useState<EnvShareResponse | null>(
    null,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (createdShare && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [createdShare]);

  if (!isOpen) return null;

  const handleCreateAnother = () => {
    setCreatedShare(null);
    setPassword('');
    setExpiresAt('');
    setMaxViews(5);
    setMaxDownloads(1);
    setOneTime(false);
    setWhitelistedIpsText('');
    setIpError(null);
    setApiError(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setCreatedShare(null);

    const ipValidationError = validateIpList(whitelistedIpsText);
    if (ipValidationError) {
      setIpError(ipValidationError);
      return;
    }
    setIpError(null);

    if (!password) {
      setApiError('Password is required.');
      return;
    }

    const payload: EnvShareCreatePayload = {
      password,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      max_views: maxViews,
      max_downloads: maxDownloads,
      one_time: oneTime,
      whitelisted_ips: whitelistedIpsText
        ? parseIpList(whitelistedIpsText)
        : null,
    };

    try {
      setLoading(true);
      const response = await envShareApi.create(environmentId, payload);
      setCreatedShare(response.data ?? response);
      if (onCreated) {
        onCreated(response.data ?? response);
      }
    } catch (error: any) {
      setApiError(
        apiErrorToMessage(
          error?.response?.data?.detail,
          'Failed to create share link. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setExpiresAt('');
    setMaxViews(5);
    setMaxDownloads(1);
    setOneTime(false);
    setWhitelistedIpsText('');
    setIpError(null);
    setApiError(null);
    setCreatedShare(null);
    onClose();
  };

  const handleCopyUrl = async () => {
    if (!createdShare) return;
    const fullUrl = `${window.location.origin}${createdShare.share_url}`;
    await navigator.clipboard.writeText(fullUrl);
  };

  const getFullShareUrl = (): string => {
    if (!createdShare) return '';
    return `${window.location.origin}${createdShare.share_url}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="my-auto w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col rounded-lg bg-white shadow-xl">
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Share Link
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        {createdShare ? (
          <>
            <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-200">
                  <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h3 className="text-base font-semibold text-green-900">
                  Share link created
                </h3>
              </div>
              <p className="mb-3 text-sm text-green-800">
                Copy the link below and share it with the password you set. Anyone with the link and password can view the environment variables.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded bg-white px-3 py-2 text-sm text-gray-800 ring-1 ring-green-200">
                  {getFullShareUrl()}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="shrink-0 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Copy link
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-green-800">
                <span>{createdShare.expires_at ? `Expires: ${new Date(createdShare.expires_at).toLocaleString()}` : 'No expiry'}</span>
                <span>Views: {createdShare.max_views} · Downloads: {createdShare.max_downloads}</span>
                <span>One-time: {createdShare.one_time ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              You can create another share link below or close to finish.
            </p>
            <hr className="my-4 border-gray-200" />
          </>
        ) : null}
        <p className="mb-4 text-sm text-yellow-700">
          Share links expose decrypted environment values to anyone with the
          link and password. Use strong passwords and short expirations. One-time
          and low limits are recommended for sensitive environments.
        </p>

        <form id="create-share-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Expiry (optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Views
              </label>
              <input
                type="number"
                min={0}
                value={maxViews}
                onChange={(e) => setMaxViews(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                0 means unlimited views (until expired or revoked).
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Downloads
              </label>
              <input
                type="number"
                min={0}
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                0 means unlimited downloads (not recommended).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOneTime((prev) => !prev)}
              className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                oneTime ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  oneTime ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              One-time link
            </span>
          </div>
          {oneTime && (
            <p className="text-xs text-red-600">
              This link will be deactivated after the first successful view.
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Whitelisted IPs (optional)
            </label>
            <textarea
              value={whitelistedIpsText}
              onChange={(e) => setWhitelistedIpsText(e.target.value)}
              className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="One IPv4 address per line"
            />
            {ipError && (
              <p className="mt-1 text-xs text-red-600">{ipError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              If empty, all IPs are allowed. When set, only listed IPv4
              addresses can access the link.
            </p>
          </div>

          {apiError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {apiError}
            </div>
          )}
        </form>
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
          {createdShare ? (
            <>
              <button
                type="button"
                onClick={handleCreateAnother}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Create another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-share-form"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? 'Creating…' : 'Create Share Link'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

