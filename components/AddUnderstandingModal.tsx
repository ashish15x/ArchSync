'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddUnderstandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

const MAX_CHARS = 200;

export default function AddUnderstandingModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: AddUnderstandingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    developer_name: '',
    change_description: '',
    module_name: '',
    understanding_text: '',
    confidence_score: 3,
  });

  const currentTime = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const remainingChars = MAX_CHARS - formData.understanding_text.length;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.developer_name.trim()) {
      toast.error('Developer name is required');
      return;
    }
    if (!formData.change_description.trim()) {
      toast.error('Change description is required');
      return;
    }
    if (!formData.module_name.trim()) {
      toast.error('Module name is required');
      return;
    }
    if (!formData.understanding_text.trim()) {
      toast.error('Understanding text is required');
      return;
    }
    if (formData.understanding_text.length > MAX_CHARS) {
      toast.error(`Understanding text must be ${MAX_CHARS} characters or less`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/understandings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          developer_name: formData.developer_name.trim(),
          change_description: formData.change_description.trim(),
          module_name: formData.module_name.trim(),
          understanding_text: formData.understanding_text.trim(),
          confidence_score: formData.confidence_score,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit understanding');
      }

      toast.success('Understanding submitted successfully!');
      setFormData({
        developer_name: '',
        change_description: '',
        module_name: '',
        understanding_text: '',
        confidence_score: 3,
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit understanding');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Add Understanding</h2>
            <p className="text-sm text-gray-400 mt-1">Share your knowledge with the team</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Developer Name */}
          <div>
            <label htmlFor="developer_name" className="block text-sm font-medium mb-2">
              Developer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="developer_name"
              required
              value={formData.developer_name}
              onChange={(e) => setFormData({ ...formData, developer_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Your name"
              disabled={loading}
            />
          </div>

          {/* Change Description */}
          <div>
            <label htmlFor="change_description" className="block text-sm font-medium mb-2">
              What did you change? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="change_description"
              required
              value={formData.change_description}
              onChange={(e) => setFormData({ ...formData, change_description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g., Added JWT authentication"
              disabled={loading}
            />
          </div>

          {/* Module Name */}
          <div>
            <label htmlFor="module_name" className="block text-sm font-medium mb-2">
              Module Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="module_name"
              required
              value={formData.module_name}
              onChange={(e) => setFormData({ ...formData, module_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g., Authentication"
              disabled={loading}
            />
          </div>

          {/* Understanding Text */}
          <div>
            <label htmlFor="understanding_text" className="block text-sm font-medium mb-2">
              Your Understanding <span className="text-red-500">*</span>
            </label>
            <textarea
              id="understanding_text"
              required
              value={formData.understanding_text}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setFormData({ ...formData, understanding_text: e.target.value });
                }
              }}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Explain your approach, assumptions, and architectural decisions..."
              rows={6}
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Share your technical insights and decision-making process
              </p>
              <span
                className={`text-sm ${
                  remainingChars < 20 ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                {formData.understanding_text.length}/{MAX_CHARS}
              </span>
            </div>
          </div>

          {/* Confidence Slider */}
          <div>
            <label htmlFor="confidence_score" className="block text-sm font-medium mb-2">
              Confidence Level
              <span className="ml-2 text-xs text-gray-500 font-normal" title="Rate how confident you are in this understanding">
                (How sure are you?)
              </span>
            </label>
            <div className="space-y-3">
              <input
                type="range"
                id="confidence_score"
                min="1"
                max="5"
                value={formData.confidence_score}
                onChange={(e) =>
                  setFormData({ ...formData, confidence_score: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                disabled={loading}
                title={`Confidence: ${formData.confidence_score}/5`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span title="Exploratory idea, not tested">Low (1)</span>
                <span title="Working solution, some uncertainty">Medium (3)</span>
                <span title="Proven approach, highly confident">High (5)</span>
              </div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 rounded-full text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < formData.confidence_score ? 'text-yellow-500' : 'text-gray-600'}
                    >
                      {i < formData.confidence_score ? '⭐' : '○'}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-950 px-4 py-3 rounded-lg border border-gray-800">
            <Clock className="w-4 h-4" />
            <span>Timestamp: {currentTime}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Understanding'
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
