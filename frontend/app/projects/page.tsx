'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { projectsApi } from '@/lib/api';
import Link from 'next/link';
import { apiErrorToMessage } from '@/utils/apiError';

interface Project {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      setProjects(response.data);
    } catch (err: any) {
      setError(apiErrorToMessage(err.response?.data?.detail, 'Failed to load projects'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      await projectsApi.create(projectName);
      setProjectName('');
      setShowCreateModal(false);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create project');
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    try {
      await projectsApi.update(editingProject.id, editName.trim());
      setShowEditModal(false);
      setEditingProject(null);
      setEditName('');
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update project');
    }
  };

  const openDeleteConfirm = (project: Project) => {
    setProjectToDelete(project);
    setDeleteError('');
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      setDeleteError('');
      await projectsApi.delete(projectToDelete.id);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err: any) {
      setDeleteError(
        apiErrorToMessage(err.response?.data?.detail, 'Failed to delete project')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Project
              </button>
            </div>

            {showCreateModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create Project</h3>
                  <form onSubmit={handleCreateProject}>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Project name"
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setProjectName('');
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

            {showEditModal && editingProject && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Project</h3>
                  <form onSubmit={handleUpdateProject}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Project name"
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingProject(null);
                          setEditName('');
                        }}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {projectToDelete && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                  aria-hidden="true"
                  onClick={() => {
                    if (!deleting) {
                      setProjectToDelete(null);
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
                          Delete project
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Delete project <strong className="text-gray-700">"{projectToDelete.name}"</strong>?
                          This will remove all environments and variables. This cannot be undone.
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
                            setProjectToDelete(null);
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
                        onClick={handleConfirmDeleteProject}
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
              <div className="text-center py-12">Loading projects...</div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600 flex-1 min-w-0"
                      >
                        {project.name}
                      </Link>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(project)}
                          className="text-sm text-gray-600 hover:text-blue-600 px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(project)}
                          className="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/environments/${project.id}`}
                      className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Manage environments →
                    </Link>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No projects yet. Create your first project!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

