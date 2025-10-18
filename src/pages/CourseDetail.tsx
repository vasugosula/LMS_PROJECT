import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { AssignmentModal } from '../components/AssignmentModal';
import { SubmissionModal } from '../components/SubmissionModal';
import { GradingModal } from '../components/GradingModal';
import { Leaderboard } from '../components/Leaderboard';
import { CourseChat } from '../components/CourseChat';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
  created_at: string;
  submission?: {
    id: string;
    content: string;
    file_url: string | null;
    submitted_at: string;
  };
  grade?: {
    marks: number;
    feedback: string | null;
  };
}

interface Submission {
  id: string;
  content: string;
  file_url: string | null;
  submitted_at: string;
  student_name: string;
  assignment_title: string;
  max_marks: number;
  grade?: {
    marks: number;
    feedback: string | null;
  };
}

interface CourseDetailProps {
  courseId: string;
  courseName: string;
  onBack: () => void;
}

export function CourseDetail({ courseId, courseName, onBack }: CourseDetailProps) {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState<string | null>(null);
  const [showGradingModal, setShowGradingModal] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions' | 'leaderboard' | 'chat' | 'people'>('assignments');
  const [classmates, setClassmates] = useState<Array<{ id: string; name: string; role: string }>>([]);

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    loadData();
  }, [courseId, user]);

  const loadData = async () => {
    setLoading(true);
    if (isTeacher) {
      await loadSubmissionsForTeacher();
    } else {
      await loadAssignmentsForStudent();
      await loadClassmates();
    }
    setLoading(false);
  };

  const loadClassmates = async () => {
    try {
      // Get enrolled student ids
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId);

      if (enrollmentsError) throw enrollmentsError;

      const ids = (enrollments || [])
        .map((e: any) => e.student_id)
        .filter((id: string) => id && id !== user?.id);

      if (ids.length === 0) {
        setClassmates([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', ids);

      if (profilesError) throw profilesError;

      setClassmates(
        (profilesData || []).map((p: any) => ({ id: p.id, name: p.name, role: p.role }))
      );
    } catch (error) {
      console.error('Error loading classmates:', error);
    }
  };

  const loadAssignmentsForStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          submissions!left(
            id,
            content,
            file_url,
            submitted_at,
            grades(marks, feedback)
          )
        `)
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const assignmentsData = (data || []).map(assignment => {
        const userSubmission = assignment.submissions?.find(
          (s: any) => s.student_id === user?.id
        );
        return {
          ...assignment,
          submission: userSubmission || undefined,
          grade: userSubmission?.grades?.[0] || undefined,
        };
      });

      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadSubmissionsForTeacher = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments!inner(course_id, title, max_marks),
          profiles(name),
          grades(marks, feedback)
        `)
        .eq('assignments.course_id', courseId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const submissionsData = (data || []).map(submission => ({
        ...submission,
        student_name: submission.profiles?.name || 'Unknown',
        assignment_title: submission.assignments.title,
        max_marks: submission.assignments.max_marks,
        grade: submission.grades?.[0] || undefined,
      }));

      setSubmissions(submissionsData);

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isOverdue = now > dueDate;

    if (assignment.grade) {
      return { icon: CheckCircle, color: 'text-green-500', label: 'Graded' };
    }
    if (assignment.submission) {
      return { icon: Clock, color: 'text-blue-500', label: 'Submitted' };
    }
    if (isOverdue) {
      return { icon: AlertCircle, color: 'text-red-500', label: 'Overdue' };
    }
    return { icon: FileText, color: 'text-gray-500', label: 'Pending' };
  };

  const getRankBadge = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return { label: 'Platinum', color: 'from-purple-500 to-pink-600' };
    if (percentage >= 75) return { label: 'Gold', color: 'from-yellow-500 to-orange-500' };
    if (percentage >= 50) return { label: 'Silver', color: 'from-gray-400 to-gray-500' };
    return { label: 'Bronze', color: 'from-orange-700 to-red-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{courseName}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isTeacher ? 'Manage assignments and grade submissions' : 'View assignments and submit your work'}
            </p>
          </div>

          {isTeacher && (
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>New Assignment</span>
            </button>
          )}
        </div>

        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          {['assignments', 'submissions', 'leaderboard', 'chat', 'people'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No assignments yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isTeacher ? 'Create your first assignment' : 'Check back later for assignments'}
                </p>
              </div>
            ) : (
              assignments.map((assignment) => {
                const status = getAssignmentStatus(assignment);
                const StatusIcon = status.icon;

                return (
                  <div
                    key={assignment.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{assignment.title}</h3>
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                          <span className={`text-sm ${status.color}`}>{status.label}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{assignment.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                          <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                          <span>Max Marks: {assignment.max_marks}</span>
                        </div>
                      </div>

                      {!isTeacher && !assignment.submission && (
                        <button
                          onClick={() => setShowSubmissionModal(assignment.id)}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-teal-700 transition-all duration-200"
                        >
                          Submit
                        </button>
                      )}
                    </div>

                    {assignment.grade && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800 dark:text-white">Your Grade:</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-gray-800 dark:text-white">
                              {assignment.grade.marks}/{assignment.max_marks}
                            </span>
                            <div className={`px-4 py-1 bg-gradient-to-r ${getRankBadge(assignment.grade.marks, assignment.max_marks).color} rounded-full text-white font-bold`}>
                              {getRankBadge(assignment.grade.marks, assignment.max_marks).label}
                            </div>
                          </div>
                        </div>
                        {assignment.grade.feedback && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                            <strong>Feedback:</strong> {assignment.grade.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'submissions' && isTeacher && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No submissions yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Student submissions will appear here</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{submission.student_name}</h3>
                        {submission.grade && (
                          <div className={`px-3 py-1 bg-gradient-to-r ${getRankBadge(submission.grade.marks, submission.max_marks).color} rounded-full text-white text-sm font-bold`}>
                            {getRankBadge(submission.grade.marks, submission.max_marks).label}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{submission.assignment_title}</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{submission.content}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setShowGradingModal(submission)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      {submission.grade ? 'Update Grade' : 'Grade'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard courseId={courseId} />
        )}

        {activeTab === 'chat' && (
          <CourseChat courseId={courseId} />
        )}

        {activeTab === 'people' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Classmates</h3>
            {classmates.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No classmates yet. Enrollments will appear here.</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {classmates.map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{m.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{m.role}</p>
                    </div>
                    <div className="space-x-2">
                      <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                        View Profile
                      </button>
                      <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        Message
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {showAssignmentModal && (
        <AssignmentModal
          courseId={courseId}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={loadData}
        />
      )}

      {showSubmissionModal && (
        <SubmissionModal
          assignmentId={showSubmissionModal}
          assignmentTitle={assignments.find(a => a.id === showSubmissionModal)?.title || ''}
          onClose={() => setShowSubmissionModal(null)}
          onSuccess={loadData}
        />
      )}

      {showGradingModal && (
        <GradingModal
          submissionId={showGradingModal.id}
          studentName={showGradingModal.student_name}
          content={showGradingModal.content}
          fileUrl={showGradingModal.file_url}
          maxMarks={showGradingModal.max_marks}
          existingGrade={showGradingModal.grade}
          onClose={() => setShowGradingModal(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
