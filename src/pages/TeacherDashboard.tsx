import { useState, useEffect } from 'react';
import { BookOpen, Users, FileText, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CourseCard } from '../components/CourseCard';
import { CourseDetail } from './CourseDetail';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  enrollment_count?: number;
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const coursesWithCount = await Promise.all(
        (data || []).map(async (course) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return { ...course, enrollment_count: count || 0 };
        })
      );

      setCourses(coursesWithCount);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          teacher_id: user?.id!,
        });

      if (error) throw error;

      setNewCourse({ title: '', description: '' });
      setShowModal(false);
      await loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <CourseDetail
        courseId={selectedCourse.id}
        courseName={selectedCourse.title}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Teacher Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your courses and track student progress</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Create Course</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8" />
              <span className="text-3xl font-bold">{courses.length}</span>
            </div>
            <p className="text-blue-100">Total Courses</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
              <span className="text-3xl font-bold">
                {courses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0)}
              </span>
            </div>
            <p className="text-green-100">Total Students</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8" />
              <span className="text-3xl font-bold">0</span>
            </div>
            <p className="text-purple-100">Assignments</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">My Courses</h2>
          {courses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No courses yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first course to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  description={course.description}
                  enrollmentCount={course.enrollment_count}
                  thumbnail={course.thumbnail_url || undefined}
                  onClick={() => setSelectedCourse({ id: course.id, title: course.title })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Create New Course</h2>

            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-white"
                  placeholder="Introduction to Programming"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-white resize-none"
                  placeholder="Describe what students will learn in this course..."
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
