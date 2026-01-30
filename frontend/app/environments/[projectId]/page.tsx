'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import EnvTable from '@/components/EnvTable';
import EnvModal from '@/components/EnvModal';
import { environmentsApi, envVarsApi } from '@/lib/api';

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
  const [newEnvName, setNewEnvName] = useState('');

  useEffect(() => {
    fetchEnvironments();
  }, [projectId]);

  useEffect(() => {
    if (selectedEnvironment) {
      fetchEnvVars(selectedEnvironment);
    }
  }, [selectedEnvironment]);

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
                  </div>
                )}
              </>
            )}

            <EnvModal
              isOpen={showEnvModal}
              onClose={() => setShowEnvModal(false)}
              onSubmit={handleAddEnvVar}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

