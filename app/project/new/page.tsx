'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hld_text: '',
    lld_text: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          hld_text: formData.hld_text.trim() || null,
          lld_text: formData.lld_text.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const project = await response.json();
      toast.success('Project created successfully!');
      router.push(`/project/${project.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <h1 className="text-4xl font-bold mb-2">Create New Project</h1>
        <p className="text-gray-400 mb-8">
          Add your architecture documentation to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter project name"
              disabled={loading}
            />
          </div>

          {/* HLD Document */}
          <div>
            <label htmlFor="hld_text" className="block text-sm font-medium mb-2">
              High-Level Design (HLD)
            </label>
            <textarea
              id="hld_text"
              value={formData.hld_text}
              onChange={(e) => setFormData({ ...formData, hld_text: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Paste your High-Level Design document here..."
              rows={12}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add your system architecture overview, components, and design decisions
            </p>
          </div>

          {/* LLD Document */}
          <div>
            <label htmlFor="lld_text" className="block text-sm font-medium mb-2">
              Low-Level Design (LLD)
            </label>
            <textarea
              id="lld_text"
              value={formData.lld_text}
              onChange={(e) => setFormData({ ...formData, lld_text: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Paste your Low-Level Design document here..."
              rows={12}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add detailed technical specifications, APIs, and implementation details
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
