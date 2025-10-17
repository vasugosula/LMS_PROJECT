-- Ensure RLS is enabled and create owner policies for profiles (id === auth.uid())

-- Enable RLS if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'profiles' AND n.nspname = 'public'
  ) THEN
    RAISE NOTICE 'Table public.profiles does not exist; skipping RLS enable.';
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_policy p ON p.polrelid = c.oid
      WHERE c.relname = 'profiles' AND n.nspname = 'public'
    ) THEN
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

-- Create owner policies (id must equal auth.uid())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'profiles_owner_select'
  ) THEN
    CREATE POLICY profiles_owner_select
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'profiles_owner_insert'
  ) THEN
    CREATE POLICY profiles_owner_insert
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'profiles_owner_update'
  ) THEN
    CREATE POLICY profiles_owner_update
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'profiles_owner_delete'
  ) THEN
    CREATE POLICY profiles_owner_delete
      ON public.profiles
      FOR DELETE
      TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;