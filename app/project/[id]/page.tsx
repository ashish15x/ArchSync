'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Brain, Search as SearchIcon, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { Project, Understanding } from '@/lib/db-types';
import UnderstandingCard from '@/components/UnderstandingCard';
import AddUnderstandingModal from '@/components/AddUnderstandingModal';
import ConsensusView from '@/components/ConsensusView';
import SemanticSearch from '@/components/SemanticSearch';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type Tab = 'understandings' | 'consensus' | 'search';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [understandings, setUnderstandings] = useState<Understanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [understandingsLoading, setUnderstandingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('understandings');
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchUnderstandings();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Project not found');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast.error('Failed to load project');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnderstandings = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/understandings`);
      if (!response.ok) throw new Error('Failed to fetch understandings');
      const data = await response.json();
      setUnderstandings(data);
    } catch (error) {
      toast.error('Failed to load understandings');
      console.error(error);
    } finally {
      setUnderstandingsLoading(false);
    }
  };

  // Get unique module names for consensus view (must be before any early returns)
  const uniqueModules = useMemo(() => {
    return Array.from(new Set(understandings.map(u => u.module_name))).sort();
  }, [understandings]);

  const toggleModule = (moduleName: string) => {
    setCollapsedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleName)) {
        newSet.delete(moduleName);
      } else {
        newSet.add(moduleName);
      }
      return newSet;
    });
  };

  const groupByModule = (understandings: Understanding[]) => {
    const grouped: Record<string, Understanding[]> = {};
    understandings.forEach((u) => {
      if (!grouped[u.module_name]) {
        grouped[u.module_name] = [];
      }
      grouped[u.module_name].push(u);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <p className="text-gray-400">Project not found</p>
          <Link href="/" className="text-blue-500 hover:text-blue-400 mt-4 inline-block">
            Go back to projects
          </Link>
        </div>
      </div>
    );
  }

  const groupedUnderstandings = groupByModule(understandings);
  const moduleNames = Object.keys(groupedUnderstandings).sort();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
          <p className="text-gray-400">
            Created {new Date(project.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('understandings')}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
                activeTab === 'understandings'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              <Brain className="w-5 h-5" />
              Understandings
            </button>
            <button
              onClick={() => setActiveTab('consensus')}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
                activeTab === 'consensus'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
              Consensus
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              <SearchIcon className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'understandings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Team Understandings</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {understandings.length} {understandings.length === 1 ? 'understanding' : 'understandings'} recorded
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Understanding
              </button>
            </div>

            {understandingsLoading ? (
              <div className="text-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading understandings...
              </div>
            ) : understandings.length === 0 ? (
              <div className="text-center py-16 border border-gray-800 rounded-lg">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">No understandings yet</h3>
                <p className="text-gray-400 mb-6">
                  Add your first understanding to start building team knowledge.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Understanding
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {moduleNames.map((moduleName) => {
                  const moduleUnderstandings = groupedUnderstandings[moduleName].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  );
                  const isCollapsed = collapsedModules.has(moduleName);

                  return (
                    <div key={moduleName} className="border border-gray-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(moduleName)}
                        className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isCollapsed ? (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                          <h3 className="text-lg font-semibold">{moduleName}</h3>
                          <span className="text-sm text-gray-500">
                            ({moduleUnderstandings.length})
                          </span>
                        </div>
                      </button>
                      {!isCollapsed && (
                        <div className="p-4 space-y-4">
                          {moduleUnderstandings.map((understanding) => (
                            <UnderstandingCard key={understanding.id} understanding={understanding} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consensus' && (
          <ConsensusView projectId={params.id as string} modules={uniqueModules} />
        )}

        {activeTab === 'search' && (
          <SemanticSearch 
            projectId={params.id as string}
            onViewInContext={(understandingId) => {
              setActiveTab('understandings');
              // Scroll to understanding would be implemented here
              toast.success('Switched to Understandings tab');
            }}
          />
        )}
      </div>

      {/* Add Understanding Modal */}
      <AddUnderstandingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={params.id as string}
        onSuccess={fetchUnderstandings}
      />
    </div>
  );
}
