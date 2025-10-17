import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Award, TrendingUp, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CourseCard } from '../components/CourseCard';
import { CourseDetail } from './CourseDetail';

interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  thumbnail_url: string | null;
  teacher_name?: string;
  enrollment_count?: number;
  is_enrolled?: boolean;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:teacher_id (name)
        `)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user?.id);

      if (enrollmentsError) throw enrollmentsError;

      const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);

      const coursesWithTeacher = (allCourses || []).map(course => ({
        ...course,
        teacher_name: course.profiles?.name || 'Unknown',
        is_enrolled: enrolledIds.has(course.id),
      }));

      setEnrolledCourses(coursesWithTeacher.filter(c => c.is_enrolled));
      setCourses(coursesWithTeacher.filter(c => !c.is_enrolled));
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          student_id: user?.id!,
        });

      if (error) throw error;
      await loadCourses();
    } catch (error) {
      console.error('Error enrolling:', error);
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Student Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your learning progress and explore new courses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8" />
              <span className="text-3xl font-bold">{enrolledCourses.length}</span>
            </div>
            <p className="text-blue-100">Enrolled Courses</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8" />
              <span className="text-3xl font-bold">0</span>
            </div>
            <p className="text-green-100">Completed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <span className="text-3xl font-bold">0</span>
            </div>
            <p className="text-purple-100">Assignments Due</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-3xl font-bold">0%</span>
            </div>
            <p className="text-orange-100">Average Grade</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">My Courses</h2>
          {enrolledCourses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No courses enrolled yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start your learning journey by enrolling in courses below</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  description={course.description}
                  teacherName={course.teacher_name}
                  thumbnail={course.thumbnail_url || undefined}
                  onClick={() => setSelectedCourse({ id: course.id, title: course.title })}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Available Courses</h2>
            <button
              onClick={() => setShowAllCourses(!showAllCourses)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {showAllCourses ? 'Show Less' : 'View All'}
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No courses available</h3>
              <p className="text-gray-600 dark:text-gray-400">Check back later for new courses</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAllCourses ? courses : courses.slice(0, 6)).map((course) => (
                <div key={course.id} className="relative">
                  <CourseCard
                    title={course.title}
                    description={course.description}
                    teacherName={course.teacher_name}
                    thumbnail={course.thumbnail_url || undefined}
                  />
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
