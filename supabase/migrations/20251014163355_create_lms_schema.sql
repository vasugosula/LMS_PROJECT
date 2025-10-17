/*
  # LMS Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `role` (text) - 'teacher' or 'student'
      - `avatar_url` (text, nullable)
      - `created_at` (timestamptz)
      
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `teacher_id` (uuid, references profiles)
      - `thumbnail_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `enrollments`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `student_id` (uuid, references profiles)
      - `enrolled_at` (timestamptz)
      
    - `assignments`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `title` (text)
      - `description` (text)
      - `due_date` (timestamptz)
      - `max_marks` (integer)
      - `created_at` (timestamptz)
      
    - `submissions`
      - `id` (uuid, primary key)
      - `assignment_id` (uuid, references assignments)
      - `student_id` (uuid, references profiles)
      - `content` (text)
      - `file_url` (text, nullable)
      - `submitted_at` (timestamptz)
      
    - `grades`
      - `id` (uuid, primary key)
      - `submission_id` (uuid, references submissions)
      - `marks` (integer)
      - `feedback` (text, nullable)
      - `graded_at` (timestamptz)
      
    - `forum_posts`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `created_at` (timestamptz)
      
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `type` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Teachers can manage their own courses
    - Students can view enrolled courses and submit assignments
    - Users can only access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrollments for their courses"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can enroll in courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );

CREATE POLICY "Students can unenroll from courses"
  ON enrollments FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  due_date timestamptz NOT NULL,
  max_marks integer NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND (
        courses.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.course_id = courses.id
          AND enrollments.student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own course assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete own course assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  file_url text,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM assignments
      JOIN courses ON courses.id = assignments.course_id
      WHERE assignments.id = submissions.assignment_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can create submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  marks integer NOT NULL,
  feedback text,
  graded_at timestamptz DEFAULT now(),
  UNIQUE(submission_id)
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own grades"
  ON grades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = grades.submission_id
      AND (
        submissions.student_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM assignments
          JOIN courses ON courses.id = assignments.course_id
          WHERE assignments.id = submissions.assignment_id
          AND courses.teacher_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Teachers can create grades"
  ON grades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      JOIN assignments ON assignments.id = submissions.assignment_id
      JOIN courses ON courses.id = assignments.course_id
      WHERE submissions.id = grades.submission_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update grades"
  ON grades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      JOIN assignments ON assignments.id = submissions.assignment_id
      JOIN courses ON courses.id = assignments.course_id
      WHERE submissions.id = grades.submission_id
      AND courses.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      JOIN assignments ON assignments.id = submissions.assignment_id
      JOIN courses ON courses.id = assignments.course_id
      WHERE submissions.id = grades.submission_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view forum posts"
  ON forum_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = forum_posts.course_id
      AND (
        courses.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.course_id = courses.id
          AND enrollments.student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Enrolled users can create forum posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = forum_posts.course_id
      AND (
        courses.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.course_id = courses.id
          AND enrollments.student_id = auth.uid()
        )
      )
    )
  );

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_course_id ON forum_posts(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);