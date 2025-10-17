import { useState } from 'react';
import { X, Award, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GradingModalProps {
  submissionId: string;
  studentName: string;
  content: string;
  fileUrl: string | null;
  maxMarks: number;
  existingGrade?: {
    marks: number;
    feedback: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const getRankFromMarks = (marks: number, maxMarks: number): string => {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return 'Platinum';
  if (percentage >= 75) return 'Gold';
  if (percentage >= 50) return 'Silver';
  return 'Bronze';
};

const getRankColor = (rank: string): string => {
  switch (rank) {
    case 'Platinum': return 'from-purple-500 to-pink-600';
    case 'Gold': return 'from-yellow-500 to-orange-500';
    case 'Silver': return 'from-gray-400 to-gray-500';
    case 'Bronze': return 'from-orange-700 to-red-700';
    default: return 'from-gray-500 to-gray-600';
  }
};

export function GradingModal({
  submissionId,
  studentName,
  content,
  fileUrl,
  maxMarks,
  existingGrade,
  onClose,
  onSuccess
}: GradingModalProps) {
  const [marks, setMarks] = useState(existingGrade?.marks || 0);
  const [feedback, setFeedback] = useState(existingGrade?.feedback || '');
  const [loading, setLoading] = useState(false);

  const rank = getRankFromMarks(marks, maxMarks);
  const rankColor = getRankColor(rank);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('grades').upsert({
        submission_id: submissionId,
        marks,
        feedback: feedback || null,
      }, {
        onConflict: 'submission_id'
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error grading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Grade Submission</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{studentName}</p>
            </div>
          </div>

          <div className={`px-6 py-3 bg-gradient-to-r ${rankColor} rounded-xl text-white font-bold flex items-center space-x-2`}>
            <Star className="w-5 h-5" />
            <span>{rank}</span>
          </div>
        </div>

        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Student Submission</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{content}</p>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-2"
            >
              <LinkIcon className="w-4 h-4" />
              <span>View Attached File/Link</span>
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Marks (out of {maxMarks})
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                value={marks}
                onChange={(e) => setMarks(parseInt(e.target.value))}
                min="0"
                max={maxMarks}
                className="flex-1"
              />
              <input
                type="number"
                value={marks}
                onChange={(e) => setMarks(parseInt(e.target.value))}
                min="0"
                max={maxMarks}
                className="w-24 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-white text-center font-bold"
                required
              />
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Percentage: {((marks / maxMarks) * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-white resize-none"
              placeholder="Provide constructive feedback to help the student improve..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : existingGrade ? 'Update Grade' : 'Submit Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LinkIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
