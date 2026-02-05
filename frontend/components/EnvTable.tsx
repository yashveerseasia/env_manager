'use client';

import { useState } from 'react';
import { envVarsApi } from '@/lib/api';

interface EnvVariable {
  id: number;
  key: string;
  value: string;
  is_secret: boolean;
  environment_id: number;
  created_at: string;
  updated_at?: string;
}

interface EnvTableProps {
  environmentId: number;
  envVars: EnvVariable[];
  onRefresh: () => void;
  canEdit: boolean;
}

export default function EnvTable({ environmentId, envVars, onRefresh, canEdit }: EnvTableProps) {
  const [revealedSecrets, setRevealedSecrets] = useState<Set<number>>(new Set());
  const [revealedValues, setRevealedValues] = useState<Map<number, string>>(new Map());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editIsSecret, setEditIsSecret] = useState(false);

  const revealSecret = async (id: number) => {
    try {
      const response = await envVarsApi.getById(id, true);
      setRevealedSecrets(new Set([...revealedSecrets, id]));
      setRevealedValues(new Map([...revealedValues, [id, response.data.value]]));
    } catch (error) {
      console.error('Failed to reveal secret:', error);
      alert('Failed to reveal secret. You may not have permission.');
    }
  };

  const startEdit = (envVar: EnvVariable) => {
    setEditingId(envVar.id);
    setEditKey(envVar.key);
    setEditValue(envVar.value);
    setEditIsSecret(envVar.is_secret);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditKey('');
    setEditValue('');
    setEditIsSecret(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      await envVarsApi.update(editingId, {
        key: editKey,
        value: editValue,
        is_secret: editIsSecret,
      });
      onRefresh();
      cancelEdit();
    } catch (error) {
      console.error('Failed to update env var:', error);
      alert('Failed to update environment variable');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this environment variable?')) {
      return;
    }

    try {
      await envVarsApi.delete(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete env var:', error);
      alert('Failed to delete environment variable');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await envVarsApi.download(environmentId);
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `env_${environmentId}.env`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download env file:', error);
      alert('Failed to download environment file');
    }
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Environment Variables</h2>
        <button
          onClick={handleDownload}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Download .env
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b border-gray-300 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Key
              </th>
              <th className="px-6 py-3 border-b border-gray-300 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 border-b border-gray-300 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Secret
              </th>
              {canEdit && (
                <th className="px-6 py-3 border-b border-gray-300 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {envVars.map((envVar) => (
              <tr key={envVar.id}>
                {editingId === envVar.id ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={editKey}
                        onChange={(e) => setEditKey(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={editIsSecret}
                        onChange={(e) => setEditIsSecret(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {envVar.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {envVar.is_secret && !revealedSecrets.has(envVar.id) ? (
                        <span className="font-mono">
                          {envVar.value.length > 4
                            ? `${envVar.value.substring(0, 2)}${'*'.repeat(envVar.value.length - 4)}${envVar.value.substring(envVar.value.length - 2)}`
                            : '****'}
                          <button
                            onClick={() => revealSecret(envVar.id)}
                            className="ml-2 text-blue-600 hover:text-blue-900 text-xs"
                          >
                            Reveal
                          </button>
                        </span>
                      ) : (
                        <span className="font-mono">
                          {revealedValues.get(envVar.id) || envVar.value}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {envVar.is_secret ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Secret</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">Public</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => startEdit(envVar)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(envVar.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

