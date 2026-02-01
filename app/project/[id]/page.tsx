'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Brain, Search as SearchIcon, CheckCircle2, ChevronDown, ChevronRight, BarChart3, FileText, BookOpen } from 'lucide-react';
import { Project, Understanding } from '@/lib/db-types';
import UnderstandingCard from '@/components/UnderstandingCard';
import AddUnderstandingModal from '@/components/AddUnderstandingModal';
import ConsensusView from '@/components/ConsensusView';
import SemanticSearch from '@/components/SemanticSearch';
import DevReportViewer from '@/components/DevReportViewer';
import ChatButton from '@/components/ChatButton';
import ChatPanel from '@/components/ChatPanel';
import EarlyWarningSystem from '@/components/EarlyWarningSystem';
import DocumentEditor from '@/components/DocumentEditor';
import toast from 'react-hot-toast';

type Tab = 'understandings' | 'consensus' | 'search' | 'reports';

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
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showDocEditor, setShowDocEditor] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchUnderstandings();
    fetchReports();
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

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const response = await fetch(`/api/reports?project_id=${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!project) return;

    setGeneratingReport(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: params.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
      setShowReportViewer(true);
      toast.success(`Report #${data.report_number} generated!`);
      fetchReports(); // Refresh reports list
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
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

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            <p className="text-gray-400">
              Created {new Date(project.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => setShowDocEditor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-sm"
          >
            <BookOpen className="w-4 h-4" />
            View/Edit Design Docs
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('understandings')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'understandings'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Brain className="w-5 h-5" />
              Understandings
            </button>
            <button
              onClick={() => setActiveTab('consensus')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'consensus'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              Consensus
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <SearchIcon className="w-5 h-5" />
              Search
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                fetchReports();
              }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Reports
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'understandings' && (
          <div>
            {/* Generate Report Button - Prominent at top */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-1">Development Intelligence Report</h3>
                  <p className="text-sm text-gray-400">
                    Generate a comprehensive analysis of team alignment, risks, and progress
                  </p>
                  {reports.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last generated: {new Date(reports[0]?.generated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleGenerateReport}
                  disabled={generatingReport || understandings.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      <span>Generate Dev Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Early Warning System */}
            {understandings.length >= 5 && (
              <div className="mb-8 border border-gray-800 rounded-lg p-6 bg-gray-900/50">
                <EarlyWarningSystem projectId={params.id as string} />
              </div>
            )}

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
            onViewInContext={() => {
              setActiveTab('understandings');
              // Scroll to understanding would be implemented here
              toast.success('Switched to Understandings tab');
            }}
          />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Development Intelligence Reports</h2>
              <p className="text-gray-400 text-sm">
                Historical snapshots of project health and team alignment
              </p>
            </div>

            {reportsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 border border-gray-800 rounded-lg bg-gray-900/50">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
                <p className="text-gray-400 mb-6">
                  Generate your first development summary to track project health
                </p>
                <button
                  onClick={() => setActiveTab('understandings')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  Go to Overview
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-800 rounded-lg p-6 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">Report #{report.report_number}</h3>
                          <span className="text-sm text-gray-500">
                            {new Date(report.generated_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {report.summary && (
                          <p className="text-gray-400 text-sm line-clamp-2">{report.summary}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setReportData(report);
                          setShowReportViewer(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                      >
                        View Report
                      </button>
                    </div>

                    {report.metadata && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
                        <div>
                          <p className="text-xs text-gray-500">Understandings</p>
                          <p className="text-lg font-semibold">{report.metadata.total_understandings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Modules</p>
                          <p className="text-lg font-semibold">{report.metadata.total_modules}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Avg Consensus</p>
                          <p className="text-lg font-semibold text-green-400">
                            {report.metadata.avg_consensus?.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Contributors</p>
                          <p className="text-lg font-semibold">{report.metadata.active_contributors}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Understanding Modal */}
      <AddUnderstandingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={params.id as string}
        onSuccess={fetchUnderstandings}
        existingModules={uniqueModules}
      />

      {/* Dev Report Viewer Modal */}
      {reportData && (
        <DevReportViewer
          isOpen={showReportViewer}
          onClose={() => setShowReportViewer(false)}
          content={reportData.content}
          reportNumber={reportData.report_number}
          metadata={reportData.metadata}
          generatedAt={reportData.generated_at}
          onRegenerate={handleGenerateReport}
        />
      )}

      {/* AI Chat */}
      {project && (
        <>
          <ChatButton onClick={() => setChatOpen(true)} />
          <ChatPanel
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            projectId={params.id as string}
            projectName={project.name}
          />
        </>
      )}

      {/* Document Editor */}
      {project && (
        <DocumentEditor
          isOpen={showDocEditor}
          onClose={() => setShowDocEditor(false)}
          projectId={params.id as string}
          projectName={project.name}
          initialHld={project.hld_text || ''}
          initialLld={project.lld_text || ''}
          onSave={fetchProject}
        />
      )}
    </div>
  );
}
