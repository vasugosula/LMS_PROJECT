/*
  # Enhanced LMS Features Migration

  1. Schema Updates
    - Add profile photo URL and social links to profiles table
    - Add course duration and video URL to courses table
    - Add online status tracking for users
    - Create direct messages table for private chats
    - Add file upload support for submissions
    
  2. New Tables
    - `direct_messages` for private student-teacher/student-student chats
    - `user_status` for tracking online/offline status
    
  3. Updates to Existing Tables
    - profiles: Add bio, social_links JSON, profile_photo_url
    - courses: Add duration, video_url
    - submissions: Enhance file_url handling
    - forum_posts: Add file attachments
*/

-- Update profiles table with new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'social_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photo_url text;
  END IF;
END $$;

-- Update courses table with new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'duration'
  ) THEN
    ALTER TABLE courses ADD COLUMN duration text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN video_url text;
  END IF;
END $$;

-- Create user_status table for online/offline tracking
CREATE TABLE IF NOT EXISTS user_status (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all user statuses"
  ON user_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own status"
  ON user_status FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own status"
  ON user_status FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create direct_messages table for private chats
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  file_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their direct messages"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send direct messages"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Add file_attachment column to forum_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forum_posts' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE forum_posts ADD COLUMN file_url text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_status_online ON user_status(is_online);

-- Function to auto-update user status timestamp
CREATE OR REPLACE FUNCTION update_user_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_status_timestamp_trigger'
  ) THEN
    CREATE TRIGGER update_user_status_timestamp_trigger
      BEFORE UPDATE ON user_status
      FOR EACH ROW
      EXECUTE FUNCTION update_user_status_timestamp();
  END IF;
END $$;
