export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: 'teacher' | 'student'
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'teacher' | 'student'
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'teacher' | 'student'
          avatar_url?: string | null
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          teacher_id: string
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          teacher_id: string
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          teacher_id?: string
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          course_id: string
          student_id: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          enrolled_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          enrolled_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string
          due_date: string
          max_marks: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description: string
          due_date: string
          max_marks?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string
          due_date?: string
          max_marks?: number
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          content: string
          file_url: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          content: string
          file_url?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          content?: string
          file_url?: string | null
          submitted_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          submission_id: string
          marks: number
          feedback: string | null
          graded_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          marks: number
          feedback?: string | null
          graded_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          marks?: number
          feedback?: string | null
          graded_at?: string
        }
      }
      forum_posts: {
        Row: {
          id: string
          course_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
