'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { projectsApi, environmentsApi, envVarsApi, envShareApi } from '@/lib/api';
import { apiErrorToMessage } from '@/utils/apiError';

interface Project {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

interface Environment {
  id: number;
  name: string;
  project_id: number;
  created_at: string;
}

interface EnvironmentWithCounts extends Environment {
  variableCount: number;
  shareCount: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = parseInt(params?.projectId as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isNaN(projectId)) {
      loadProjectDetail();
    }
  }, [projectId]);

  const loadProjectDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const [projectsRes, envsRes] = await Promise.all([
        projectsApi.getAll(),
        environmentsApi.getByProject(projectId),
      ]);
      const projects: Project[] = projectsRes.data ?? [];
      const found = projects.find((p) => p.id === projectId);
      if (!found) {
        setError('Project not found');
        setProject(null);
        setEnvironments([]);
        return;
      }
      setProject(found);
      const envList: Environment[] = envsRes.data ?? [];
      const envsWithCounts: EnvironmentWithCounts[] = await Promise.all(
        envList.map(async (env) => {
          const [varsRes, sharesRes] = await Promise.all([
            envVarsApi.getByEnvironment(env.id, false).then((r) => (r.data ?? []).length),
            envShareApi.list(env.id).then((r) => (Array.isArray(r.data) ? r.data : []).length),
          ]);
          return {
            ...env,
            variableCount: varsRes,
            shareCount: sharesRes,
          };
        })
      );
      setEnvironments(envsWithCounts);
    } catch (err: any) {
      setError(apiErrorToMessage(err.response?.data?.detail, 'Failed to load project'));
      setProject(null);
      setEnvironments([]);
    } finally {
      setLoading(false);
    }
  };

  if (Number.isNaN(projectId)) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              Invalid project
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
              <Link href="/projects" className="hover:text-gray-700">
                Projects
              </Link>
              <span aria-hidden>/</span>
              {project && (
                <span className="font-medium text-gray-900">{project.name}</span>
              )}
            </nav>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
                  <p className="mt-3 text-sm text-gray-500">Loading project...</p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
                <div className="mt-3">
                  <Link
                    href="/projects"
                    className="text-sm font-medium text-red-800 underline hover:no-underline"
                  >
                    Back to Projects
                  </Link>
                </div>
              </div>
            ) : project ? (
              <>
                {/* Project header card */}
                <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {project.name}
                      </h1>
                      <p className="mt-1 text-sm text-gray-500">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {environments.length} environment
                        {environments.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/environments/${projectId}`}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Manage environments
                      </Link>
                      <Link
                        href="/projects"
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Back to Projects
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Environments section */}
                <section>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Environments
                  </h2>

                  {environments.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 border-dashed bg-white p-12 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
                        />
                      </svg>
                      <p className="mt-3 text-sm text-gray-500">
                        No environments yet
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Create environments (e.g. DEV, QA, PROD) to manage variables
                      </p>
                      <Link
                        href={`/environments/${projectId}`}
                        className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Go to environments
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {environments.map((env) => (
                        <Link
                          key={env.id}
                          href={`/environments/${projectId}?env=${env.id}`}
                          className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                              <svg
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
                                />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {env.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {env.variableCount} variable{env.variableCount !== 1 ? 's' : ''} · {env.shareCount} active share link{env.shareCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <svg
                              className="h-5 w-5 shrink-0 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
