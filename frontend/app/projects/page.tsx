'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { projectsApi, environmentsApi } from '@/lib/api';
import Link from 'next/link';
import { apiErrorToMessage } from '@/utils/apiError';

interface Project {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

interface ProjectWithEnvCount extends Project {
  environmentCount: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithEnvCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithEnvCount | null>(null);
  const [editName, setEditName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithEnvCount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [openProjectDropdownId, setOpenProjectDropdownId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      const list: Project[] = response.data ?? [];
      const envLists = await Promise.all(
        list.map((p) => environmentsApi.getByProject(p.id).then((r) => r.data ?? []))
      );
      setProjects(
        list.map((p, i) => ({ ...p, environmentCount: (envLists[i] ?? []).length }))
      );
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

  const openEditModal = (project: ProjectWithEnvCount) => {
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

  const openDeleteConfirm = (project: ProjectWithEnvCount) => {
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
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
                  <p className="mt-3 text-sm text-gray-500">Loading projects...</p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {project.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {project.environmentCount} environment{project.environmentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenProjectDropdownId((id) => (id === project.id ? null : project.id));
                          }}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          title="Actions"
                          aria-haspopup="true"
                          aria-expanded={openProjectDropdownId === project.id}
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                        {openProjectDropdownId === project.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              aria-hidden="true"
                              onClick={() => setOpenProjectDropdownId(null)}
                            />
                            <div
                              className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenProjectDropdownId(null);
                                  openEditModal(project);
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenProjectDropdownId(null);
                                  openDeleteConfirm(project);
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/environments/${project.id}`}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Manage environments
                      </Link>
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View project
                      </Link>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="col-span-full rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                    <p className="text-gray-500">No projects yet. Create your first project!</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Create Project
                    </button>
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

