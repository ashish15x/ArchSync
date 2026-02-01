'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, FileText, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  initialHld: string;
  initialLld: string;
  onSave: () => void;
}

export default function DocumentEditor({
  isOpen,
  onClose,
  projectId,
  projectName,
  initialHld,
  initialLld,
  onSave,
}: DocumentEditorProps) {
  const [activeTab, setActiveTab] = useState<'hld' | 'lld'>('hld');
  const [hldText, setHldText] = useState(initialHld);
  const [lldText, setLldText] = useState(initialLld);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setHldText(initialHld);
    setLldText(initialLld);
  }, [initialHld, initialLld]);

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

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hld_text: hldText,
          lld_text: lldText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save documents');
      }

      toast.success('Documents saved successfully!');
      setIsEditing(false);
      onSave();
    } catch (error) {
      console.error('Error saving documents:', error);
      toast.error('Failed to save documents');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setHldText(initialHld);
    setLldText(initialLld);
    setIsEditing(false);
  };

  const currentText = activeTab === 'hld' ? hldText : lldText;
  const setCurrentText = activeTab === 'hld' ? setHldText : setLldText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">Design Documents</h2>
            <p className="text-sm text-gray-400 mt-1">{projectName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('hld')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'hld'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            High-Level Design (HLD)
          </button>
          <button
            onClick={() => setActiveTab('lld')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'lld'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Low-Level Design (LLD)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              className="w-full h-full min-h-[400px] px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm resize-none"
              placeholder={`Enter ${activeTab === 'hld' ? 'High-Level' : 'Low-Level'} Design documentation...`}
            />
          ) : (
            <div className="prose prose-invert max-w-none">
              {currentText ? (
                <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
                  {currentText}
                </pre>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No {activeTab === 'hld' ? 'HLD' : 'LLD'} document uploaded yet</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                  >
                    Add Document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!isEditing && (currentText) && (
          <div className="px-6 py-3 border-t border-gray-800 bg-gray-950">
            <p className="text-xs text-gray-500">
              {currentText.split(/\s+/).length} words • {currentText.length} characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
