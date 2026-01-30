'use client';

import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Projects
            </button>
            <div className="text-center py-12">
              <Link
                href={`/environments/${projectId}`}
                className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
              >
                Manage Environments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

