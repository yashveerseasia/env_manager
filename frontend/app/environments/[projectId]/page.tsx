'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import EnvTable from '@/components/EnvTable';
import EnvModal from '@/components/EnvModal';
import CreateShareModal from '@/components/share/CreateShareModal';
import ShareLinksTable from '@/components/share/ShareLinksTable';
import Link from 'next/link';
import { projectsApi, environmentsApi, envVarsApi, envShareApi } from '@/lib/api';
import type { EnvShareRecord, EnvShareResponse } from '@/types/share';
import { apiErrorToMessage } from '@/utils/apiError';
import AlertModal from '@/components/AlertModal';

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
  const searchParams = useSearchParams();
  const projectId = parseInt(params?.projectId as string);

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<number | null>(null);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showCreateEnvModal, setShowCreateEnvModal] = useState(false);
  const [showEditEnvModal, setShowEditEnvModal] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [editEnvName, setEditEnvName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [activeTab, setActiveTab] = useState<'variables' | 'share'>('variables');
  const [shareLinks, setShareLinks] = useState<EnvShareRecord[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [shareError, setShareError] = useState('');
  const [envToDelete, setEnvToDelete] = useState<Environment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [openEnvDropdownId, setOpenEnvDropdownId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    fetchEnvironments();
  }, [projectId]);

  useEffect(() => {
    if (Number.isNaN(projectId)) return;
    projectsApi
      .getAll()
      .then((r) => {
        const list = r.data ?? [];
        const p = list.find((x: { id: number }) => x.id === projectId);
        setProjectName(p ? p.name : '');
      })
      .catch(() => setProjectName(''));
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
      const envList = response.data ?? [];
      setEnvironments(envList);
      const envIdFromUrl = searchParams?.get('env');
      const envId = envIdFromUrl ? parseInt(envIdFromUrl, 10) : null;
      const envExists = envId != null && envList.some((e: Environment) => e.id === envId);
      if (envList.length > 0) {
        setSelectedEnvironment(envExists ? envId : envList[0].id);
      }
    } catch (err: any) {
      setError(apiErrorToMessage(err.response?.data?.detail, 'Failed to load environments'));
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
        apiErrorToMessage(
          err?.response?.data?.detail,
          'Failed to load share links for this environment'
        )
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
      setAlertMessage(apiErrorToMessage(err.response?.data?.detail, 'Failed to create environment'));
      setAlertOpen(true);
    }
  };

  const openEditEnvModal = (env: Environment) => {
    setEditingEnvironment(env);
    setEditEnvName(env.name);
    setShowEditEnvModal(true);
  };

  const handleUpdateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnvironment || !editEnvName.trim()) return;

    try {
      await environmentsApi.update(editingEnvironment.id, { name: editEnvName.trim() });
      setShowEditEnvModal(false);
      setEditingEnvironment(null);
      setEditEnvName('');
      fetchEnvironments();
    } catch (err: any) {
      setAlertMessage(apiErrorToMessage(err.response?.data?.detail, 'Failed to update environment'));
      setAlertOpen(true);
    }
  };

  const openDeleteConfirm = (env: Environment) => {
    setEnvToDelete(env);
    setDeleteError('');
  };

  const handleConfirmDeleteEnvironment = async () => {
    if (!envToDelete) return;
    try {
      setDeleting(true);
      setDeleteError('');
      await environmentsApi.delete(envToDelete.id);
      if (selectedEnvironment === envToDelete.id) {
        const remaining = environments.filter((e) => e.id !== envToDelete.id);
        setSelectedEnvironment(remaining.length > 0 ? remaining[0].id : null);
      }
      setEnvToDelete(null);
      fetchEnvironments();
    } catch (err: any) {
      setDeleteError(
        apiErrorToMessage(err.response?.data?.detail, 'Failed to delete environment')
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleAddEnvVar = async (key: string, value: string, isSecret: boolean) => {
    if (!selectedEnvironment) return;

    try {
      await envVarsApi.create(key, value, isSecret, selectedEnvironment);
      fetchEnvVars(selectedEnvironment);
    } catch (err: any) {
      setAlertMessage(apiErrorToMessage(err.response?.data?.detail, 'Failed to add environment variable'));
      setAlertOpen(true);
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
        apiErrorToMessage(err?.response?.data?.detail, 'Failed to revoke share link')
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
              <Link href="/projects" className="hover:text-gray-700">
                Projects
              </Link>
              <span aria-hidden>/</span>
              <Link
                href={`/projects/${projectId}`}
                className="hover:text-gray-700"
              >
                {projectName || '...'}
              </Link>
              <span aria-hidden>/</span>
              <span className="font-medium text-gray-900">Environments</span>
            </nav>
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Environments</h1>
                <button
                  onClick={() => setShowCreateEnvModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create Environment
                </button>
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
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showEditEnvModal && editingEnvironment && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Environment</h3>
                  <form onSubmit={handleUpdateEnvironment}>
                    <input
                      type="text"
                      value={editEnvName}
                      onChange={(e) => setEditEnvName(e.target.value)}
                      placeholder="Environment name"
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditEnvModal(false);
                          setEditingEnvironment(null);
                          setEditEnvName('');
                        }}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {envToDelete && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                  aria-hidden="true"
                  onClick={() => {
                    if (!deleting) {
                      setEnvToDelete(null);
                      setDeleteError('');
                    }
                  }}
                />
                <div className="flex min-h-full items-center justify-center p-4">
                  <div
                    className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col items-center text-center">
                        <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <svg
                            className="h-7 w-7 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                          </svg>
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">
                          Delete environment
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Delete environment <strong className="text-gray-700">"{envToDelete.name}"</strong>?
                          All variables in this environment will be removed. This cannot be undone.
                        </p>
                        {deleteError && (
                          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg w-full">
                            {deleteError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col-reverse gap-3 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => {
                          if (!deleting) {
                            setEnvToDelete(null);
                            setDeleteError('');
                          }
                        }}
                        className="inline-flex w-full justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={handleConfirmDeleteEnvironment}
                        className="inline-flex w-full justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
                      >
                        {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
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
                  <div className="flex flex-wrap gap-2">
                    {environments.map((env) => (
                      <div
                        key={env.id}
                        className={`inline-flex items-center gap-0 rounded ${
                          selectedEnvironment === env.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedEnvironment(env.id)}
                          className="px-4 py-2 text-left font-medium"
                        >
                          {env.name}
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenEnvDropdownId((id) => (id === env.id ? null : env.id));
                            }}
                            className={`p-2 rounded hover:bg-black/10 ${
                              selectedEnvironment === env.id ? 'text-white' : 'text-gray-600'
                            }`}
                            title="Actions"
                            aria-haspopup="true"
                            aria-expanded={openEnvDropdownId === env.id}
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                          {openEnvDropdownId === env.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                aria-hidden="true"
                                onClick={() => setOpenEnvDropdownId(null)}
                              />
                              <div
                                className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                                role="menu"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenEnvDropdownId(null);
                                    openEditEnvModal(env);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenEnvDropdownId(null);
                                    openDeleteConfirm(env);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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
                              ? 'border-blue-600 text-blue-600'
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
                              ? 'border-blue-600 text-blue-600'
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
                          onError={(message) => {
                            setAlertMessage(message);
                            setAlertOpen(true);
                          }}
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
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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

            <AlertModal
              open={alertOpen}
              title="Validation error"
              message={alertMessage}
              onClose={() => setAlertOpen(false)}
              variant="error"
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

