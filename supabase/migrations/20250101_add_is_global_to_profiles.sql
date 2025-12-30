-- Add is_global column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_global ON public.profiles(is_global);

-- Update leaderboard view or table to include is_global
-- (This will be handled by Typesense sync)

COMMENT ON COLUMN public.profiles.is_global IS 'True for Questly global users, False/NULL for Teknokul Turkish users';
