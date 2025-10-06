-- Create a new type for the access levels to ensure data integrity.
CREATE TYPE meeting_access_level AS ENUM ('PRIVATE', 'VIEWER', 'COLLABORATOR', 'EDITOR', 'OWNER');

-- Add the access_level column to the meetings table with a default of 'PRIVATE'.
ALTER TABLE public.meetings
  ADD COLUMN access_level meeting_access_level DEFAULT 'PRIVATE' NOT NULL;

-- Drop the old share_permissions column if it exists.
ALTER TABLE public.meetings
  DROP COLUMN IF EXISTS share_permissions;

-- Remove any existing policies that might conflict.
DROP POLICY IF EXISTS "Public can view shared meetings." ON public.meetings;
DROP POLICY IF EXISTS "Owners can manage their own meetings" ON public.meetings;

-- RLS Policy: Owners have unrestricted access to their meetings.
CREATE POLICY "Owners can manage their own meetings"
ON public.meetings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Allow read access for users who have been granted it.
-- This is a broad read-access policy. The application logic will handle the different levels (Viewer, Collaborator, Editor).
-- Any logged-in user can see a meeting if it's not private.
-- Unauthenticated users can also see non-private meetings.
CREATE POLICY "Users can view non-private meetings"
ON public.meetings
FOR SELECT
USING (access_level <> 'PRIVATE');

-- 1) Create view exposing only existence
CREATE OR REPLACE VIEW public.meetings_public_exists AS
SELECT meeting_id, created_at
FROM public.meetings;

-- 2) Allow public read
GRANT SELECT ON public.meetings_public_exists TO PUBLIC;

-- 3) (Optional) Prevent updates through view
REVOKE INSERT, UPDATE, DELETE ON public.meetings_public_exists FROM PUBLIC;
