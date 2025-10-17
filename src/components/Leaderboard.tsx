import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  total_marks: number;
  average_percentage: number;
  submission_count: number;
}

interface LeaderboardProps {
  courseId: string;
}

export function Leaderboard({ courseId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [courseId]);

  const loadLeaderboard = async () => {
    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          student_id,
          assignment_id,
          assignments!inner(course_id, max_marks),
          grades(marks)
        `)
        .eq('assignments.course_id', courseId);

      if (submissionsError) throw submissionsError;

      const studentStats = new Map<string, { totalMarks: number; maxPossible: number; count: number }>();

      for (const submission of submissions || []) {
        if (!submission.grades?.[0]) continue;

        const stats = studentStats.get(submission.student_id) || { totalMarks: 0, maxPossible: 0, count: 0 };
        stats.totalMarks += submission.grades[0].marks;
        stats.maxPossible += submission.assignments.max_marks;
        stats.count += 1;
        studentStats.set(submission.student_id, stats);
      }

      const studentIds = Array.from(studentStats.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', studentIds);

      if (profilesError) throw profilesError;

      const leaderboardData: LeaderboardEntry[] = Array.from(studentStats.entries())
        .map(([studentId, stats]) => {
          const profile = profiles?.find(p => p.id === studentId);
          return {
            student_id: studentId,
            student_name: profile?.name || 'Unknown',
            total_marks: stats.totalMarks,
            average_percentage: (stats.totalMarks / stats.maxPossible) * 100,
            submission_count: stats.count,
          };
        })
        .sort((a, b) => b.average_percentage - a.average_percentage)
        .slice(0, 10);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (position: number) => {
    if (position === 0) return { icon: Trophy, color: 'from-yellow-400 to-yellow-600', label: 'Champion' };
    if (position === 1) return { icon: Medal, color: 'from-gray-300 to-gray-500', label: '2nd Place' };
    if (position === 2) return { icon: Award, color: 'from-orange-600 to-orange-800', label: '3rd Place' };
    return { icon: TrendingUp, color: 'from-blue-500 to-blue-600', label: `#${position + 1}` };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Rankings Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Rankings will appear once assignments are graded
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Top Students</h2>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const badge = getRankBadge(index);
          const Icon = badge.icon;

          return (
            <div
              key={entry.student_id}
              className={`p-4 rounded-xl transition-all duration-200 ${
                index < 3
                  ? 'bg-gradient-to-r ' + badge.color + ' text-white shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index < 3 ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    <Icon className={`w-5 h-5 ${index < 3 ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      index < 3 ? 'text-white' : 'text-gray-800 dark:text-white'
                    }`}>
                      {entry.student_name}
                    </h3>
                    <p className={`text-sm ${
                      index < 3 ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {entry.submission_count} submissions
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    index < 3 ? 'text-white' : 'text-gray-800 dark:text-white'
                  }`}>
                    {entry.average_percentage.toFixed(1)}%
                  </div>
                  <div className={`text-sm ${
                    index < 3 ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {entry.total_marks} total marks
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
