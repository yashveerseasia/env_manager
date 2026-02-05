'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import EnvTable from '@/components/EnvTable';
import EnvModal from '@/components/EnvModal';
import CreateShareModal from '@/components/share/CreateShareModal';
import ShareLinksTable from '@/components/share/ShareLinksTable';
import { environmentsApi, envVarsApi, envShareApi } from '@/lib/api';
import type { EnvShareRecord, EnvShareResponse } from '@/types/share';

interface Environment {
  id: number;
  name: string;
  project_id: number;
  created_at: string;
}

interface EnvVariable {
  id: number;
  key: string;
  value: string;
  is_secret: boolean;
  environment_id: number;
  created_at: string;
  updated_at?: string;
}

export default function EnvironmentsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params?.projectId as string);

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<number | null>(null);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showCreateEnvModal, setShowCreateEnvModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [activeTab, setActiveTab] = useState<'variables' | 'share'>('variables');
  const [shareLinks, setShareLinks] = useState<EnvShareRecord[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    fetchEnvironments();
  }, [projectId]);

  useEffect(() => {
    if (selectedEnvironment) {
      fetchEnvVars(selectedEnvironment);
      if (activeTab === 'share') {
        fetchShareLinks(selectedEnvironment);
      }
    }
  }, [selectedEnvironment, activeTab]);

  const fetchEnvironments = async () => {
    try {
      const response = await environmentsApi.getByProject(projectId);
      setEnvironments(response.data);
      if (response.data.length > 0 && !selectedEnvironment) {
        setSelectedEnvironment(response.data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load environments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvVars = async (envId: number) => {
    try {
      const response = await envVarsApi.getByEnvironment(envId, false);
      setEnvVars(response.data);
    } catch (err: any) {
      console.error('Failed to load env vars:', err);
    }
  };

  const fetchShareLinks = async (envId: number) => {
    try {
      setLoadingShares(true);
      setShareError('');
      const response = await envShareApi.list(envId);
      setShareLinks(response.data ?? response);
    } catch (err: any) {
      setShareError(
        err?.response?.data?.detail ||
          'Failed to load share links for this environment'
      );
    } finally {
      setLoadingShares(false);
    }
  };

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;

    try {
      await environmentsApi.create(newEnvName, projectId);
      setNewEnvName('');
      setShowCreateEnvModal(false);
      fetchEnvironments();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create environment');
    }
  };

  const handleAddEnvVar = async (key: string, value: string, isSecret: boolean) => {
    if (!selectedEnvironment) return;

    try {
      await envVarsApi.create(key, value, isSecret, selectedEnvironment);
      fetchEnvVars(selectedEnvironment);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add environment variable');
    }
  };

  const handleShareCreated = (share: EnvShareResponse) => {
    if (selectedEnvironment) {
      fetchShareLinks(selectedEnvironment);
    }
  };

  const handleCopyShare = async (share: EnvShareRecord) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${share.token}`;
    await navigator.clipboard.writeText(url);
  };

  const handleRevokeShare = async (share: EnvShareRecord) => {
    const confirmed = window.confirm(
      'Are you sure you want to revoke this share link? This action cannot be undone.'
    );
    if (!confirmed) return;
    try {
      await envShareApi.revoke(share.id);
      if (selectedEnvironment) {
        fetchShareLinks(selectedEnvironment);
      }
    } catch (err: any) {
      setShareError(
        err?.response?.data?.detail || 'Failed to revoke share link'
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <button
                onClick={() => router.push('/projects')}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← Back to Projects
              </button>
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Environments</h1>
                <button
                  onClick={() => setShowCreateEnvModal(true)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create Environment
                </button>
              </div>
            </div>

            {showCreateEnvModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create Environment</h3>
                  <form onSubmit={handleCreateEnvironment}>
                    <input
                      type="text"
                      value={newEnvName}
                      onChange={(e) => setNewEnvName(e.target.value)}
                      placeholder="Environment name (e.g., DEV, QA, PROD)"
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateEnvModal(false);
                          setNewEnvName('');
                        }}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">Loading environments...</div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex space-x-2">
                    {environments.map((env) => (
                      <button
                        key={env.id}
                        onClick={() => setSelectedEnvironment(env.id)}
                        className={`px-4 py-2 rounded ${
                          selectedEnvironment === env.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {env.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedEnvironment && (
                  <div>
                    <div className="mb-4 border-b border-gray-200">
                      <nav className="-mb-px flex space-x-4">
                        <button
                          type="button"
                          onClick={() => setActiveTab('variables')}
                          className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                            activeTab === 'variables'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                        >
                          Variables
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('share')}
                          className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                            activeTab === 'share'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                        >
                          Share
                        </button>
                      </nav>
                    </div>

                    {activeTab === 'variables' && (
                      <>
                        <div className="mb-4">
                          <button
                            onClick={() => setShowEnvModal(true)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Add Variable
                          </button>
                        </div>
                        <EnvTable
                          environmentId={selectedEnvironment}
                          envVars={envVars}
                          onRefresh={() => fetchEnvVars(selectedEnvironment)}
                          canEdit={true}
                        />
                      </>
                    )}

                    {activeTab === 'share' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-gray-900">
                            Share Links
                          </h2>
                          <button
                            type="button"
                            onClick={() => setShowShareModal(true)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          >
                            New Share Link
                          </button>
                        </div>

                        {shareError && (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {shareError}
                          </div>
                        )}

                        {loadingShares ? (
                          <div className="text-center py-8 text-sm text-gray-500">
                            Loading share links...
                          </div>
                        ) : (
                          <ShareLinksTable
                            shares={shareLinks}
                            onCopy={handleCopyShare}
                            onRevoke={handleRevokeShare}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <EnvModal
              isOpen={showEnvModal}
              onClose={() => setShowEnvModal(false)}
              onSubmit={handleAddEnvVar}
            />

            {selectedEnvironment && (
              <CreateShareModal
                environmentId={selectedEnvironment}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onCreated={handleShareCreated}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

