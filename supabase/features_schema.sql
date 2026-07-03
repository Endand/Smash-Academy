-- Run this in the Supabase SQL Editor
-- Adds: editor roles, lesson progress tracking, image upload storage,
-- and fixes a privilege-escalation hole in the profiles update policy.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SECURITY FIX: the existing "Users can update their own profile" policy
--    has no column restriction, so any signed-in user could set is_admin=true
--    on their own row via the REST API. Column-level grants close this:
--    authenticated users may only update their username.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (username) ON TABLE public.profiles TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Editor roles: role name on each profile, assigned by admins via RPC.
--    Role permissions themselves live in site_content (__perm_<role>__ keys),
--    managed from the /admin panel.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;

CREATE OR REPLACE FUNCTION public.set_user_role(target_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE profiles SET role = NULLIF(new_role, '') WHERE id = target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Let role-holders write site_content (the UI enforces which permission
--    covers which control; the DB gate is: admin OR has any assigned role).
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "site_content_insert" ON public.site_content;
DROP POLICY IF EXISTS "site_content_update" ON public.site_content;

CREATE POLICY "site_content_insert"
  ON public.site_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role IS NOT NULL)
    )
  );

CREATE POLICY "site_content_update"
  ON public.site_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role IS NOT NULL)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Lesson progress: one row per (user, lesson). Users manage only their own.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_key   text        NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_key)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_progress_select"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "lesson_progress_insert"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lesson_progress_delete"
  ON public.lesson_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Storage bucket for lesson images (public read, editor/admin upload).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-images', 'lesson-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "lesson_images_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson-images');

CREATE POLICY "lesson_images_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role IS NOT NULL)
    )
  );

CREATE POLICY "lesson_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
