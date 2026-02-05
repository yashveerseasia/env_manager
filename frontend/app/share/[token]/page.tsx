'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { envShareApi } from '@/lib/api';
import type { EnvShareViewResponse } from '@/types/share';

export default function ShareAccessPage() {
  const params = useParams();
  const token = params?.token as string | undefined;

  const [password, setPassword] = useState('');
  const [loadingView, setLoadingView] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewData, setViewData] = useState<EnvShareViewResponse | null>(null);

  const handleView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid share token');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setError(null);
    setViewData(null);

    try {
      setLoadingView(true);
      const response = await envShareApi.view(token, password);
      setViewData(response.data ?? response);
      setError(null);
    } catch (err: any) {
      console.error('Share view error:', err);
      console.error('Error response:', err?.response);
      console.error('Error data:', err?.response?.data);
      
      // Extract the actual error message from the backend
      let message = 'Unable to view environment.';
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          message = err.response.data;
        } else if (err.response.data.detail) {
          message = err.response.data.detail;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        }
      } else if (err?.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setLoadingView(false);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    try {
      setLoadingDownload(true);
      const blob = await envShareApi.download(token, password).then(
        (res) => res.data ?? res,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'environment.env';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Unable to download environment file. The link may be invalid, expired, or your IP is not allowed.';
      setError(message);
    } finally {
      setLoadingDownload(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-semibold text-gray-900">
          Secure Environment Share
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          This environment has been shared with you via a secure link. Enter the
          password provided by the owner to view or download the environment.
        </p>

        <form className="space-y-4" onSubmit={handleView}>
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

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loadingView || !password}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loadingView ? 'Loading…' : 'View ENV'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loadingDownload || !password}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {loadingDownload ? 'Downloading…' : 'Download .env'}
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            The link owner may have configured limits (views, downloads, IP
            addresses, or one-time access). If you cannot access the
            environment, contact the owner to request a new link.
          </p>
        </form>

        {viewData && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              Environment Variables
            </h2>
            <div className="max-h-80 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-green-100">
              {viewData.variables.length === 0 ? (
                <p className="text-gray-400">No variables in this environment.</p>
              ) : (
                viewData.variables.map((v) => (
                  <div key={v.key} className="font-mono">
                    <span className="text-blue-200">{v.key}</span>
                    <span className="text-gray-400">=</span>
                    <span className="text-emerald-300">{v.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

