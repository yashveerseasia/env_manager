'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { projectsApi, environmentsApi, envShareApi } from '@/lib/api';
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

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithEnvCount[]>([]);
  const [totalShareLinks, setTotalShareLinks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectsApi.getAll();
      const list: Project[] = response.data ?? [];
      const envLists = await Promise.all(
        list.map((p) => environmentsApi.getByProject(p.id).then((r) => r.data ?? []))
      );
      const envCounts = envLists.map((envs) => envs.length);
      setProjects(
        list.map((p, i) => ({ ...p, environmentCount: envCounts[i] ?? 0 }))
      );
      const allEnvIds = envLists.flatMap((envs) => envs.map((e: { id: number }) => e.id));
      const shareCounts = await Promise.all(
        allEnvIds.map((envId: number) =>
          envShareApi.list(envId).then((r) => (Array.isArray(r.data) ? r.data.length : 0))
        )
      );
      setTotalShareLinks(shareCounts.reduce((a, b) => a + b, 0));
    } catch (err: any) {
      setError(apiErrorToMessage(err.response?.data?.detail, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const totalEnvironments = projects.reduce((s, p) => s + p.environmentCount, 0);
  const displayProjects = projects.slice(0, 6);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Overview of your projects, environments, and share links
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
                  <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total projects</p>
                        <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total environments</p>
                        <p className="text-2xl font-semibold text-gray-900">{totalEnvironments}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                        <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Active share links</p>
                        <p className="text-2xl font-semibold text-gray-900">{totalShareLinks}</p>
                        <p className="text-xs text-gray-400">Password-protected env links</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Your projects */}
                <section>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Your projects</h2>
                    <Link
                      href="/projects"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View all projects
                    </Link>
                  </div>

                  {projects.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <p className="mt-3 text-sm text-gray-500">No projects yet</p>
                      <p className="mt-1 text-sm text-gray-400">Create your first project from the Projects page</p>
                      <Link
                        href="/projects"
                        className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Go to Projects
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {displayProjects.map((project) => (
                        <div
                          key={project.id}
                          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-lg font-semibold text-gray-900">
                                {project.name}
                              </h3>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Created {new Date(project.created_at).toLocaleDateString()}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {project.environmentCount} environment{project.environmentCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={`/environments/${project.id}`}
                              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              Manage environments
                            </Link>
                            <Link
                              href={`/projects/${project.id}`}
                              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View project
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {projects.length > 6 && (
                    <div className="mt-4 text-center">
                      <Link
                        href="/projects"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View all {projects.length} projects →
                      </Link>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
