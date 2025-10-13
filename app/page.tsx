'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import { Project } from '@/lib/db-types';
import { ProjectCardSkeleton } from '@/components/LoadingSkeletons';
import toast from 'react-hot-toast';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">ArchSync - Project Intelligence</h1>
            <p className="text-gray-400">
              Manage your architecture documentation and projects
            </p>
          </div>
          <Link
            href="/project/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first project to begin documenting your architecture
            </p>
            <Link
              href="/project/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:bg-gray-900/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <FolderKanban className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                  <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                </div>
                <div className="text-sm text-gray-400">
                  Created {formatDate(project.created_at)}
                </div>
                {(project.hld_text || project.lld_text) && (
                  <div className="mt-3 flex gap-2 text-xs">
                    {project.hld_text && (
                      <span className="px-2 py-1 bg-gray-800 rounded">HLD</span>
                    )}
                    {project.lld_text && (
                      <span className="px-2 py-1 bg-gray-800 rounded">LLD</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
