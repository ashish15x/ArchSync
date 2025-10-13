import { User, Tag, Clock, Star } from 'lucide-react';
import { Understanding } from '@/lib/db-types';

interface UnderstandingCardProps {
  understanding: Understanding;
}

export default function UnderstandingCard({ understanding }: UnderstandingCardProps) {
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderStars = (score: number | null) => {
    if (!score) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= score ? 'text-yellow-500' : 'text-gray-600'}>
          {i <= score ? '⭐' : '○'}
        </span>
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const getModuleColor = (moduleName: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'bg-green-500/20 text-green-400 border-green-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    ];
    const hash = moduleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="border border-gray-800 rounded-lg p-5 hover:border-gray-700 hover:bg-gray-900/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-200">{understanding.developer_name}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getModuleColor(understanding.module_name)}`}>
                <Tag className="w-3 h-3" />
                {understanding.module_name}
              </span>
              {understanding.change_description && (
                <span className="text-xs text-gray-500">
                  • {understanding.change_description}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {understanding.confidence_score && renderStars(understanding.confidence_score)}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {getRelativeTime(understanding.created_at)}
          </div>
        </div>
      </div>

      {/* Understanding Text */}
      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
        {understanding.understanding_text}
      </div>
    </div>
  );
}
