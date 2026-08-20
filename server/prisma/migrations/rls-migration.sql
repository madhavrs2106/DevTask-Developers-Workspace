-- ============================================================
-- DevTask Supabase RLS Migration
-- ============================================================
-- This script:
--   1. Enables RLS on all tables
--   2. Creates auth.uid()-based policies (for future Supabase Auth)
--   3. Creates a secure view excluding the password column
--   4. The postgres/service_role bypasses RLS, so your
--      Express backend continues to work unchanged.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ──────────────────────────────────────────────

ALTER TABLE public."User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Task"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Project"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Course"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DailyAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ActivityLog"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SocialLink"    ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (defense against credential leaks)
ALTER TABLE public."User"          FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Task"          FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Project"       FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Course"        FORCE ROW LEVEL SECURITY;
ALTER TABLE public."DailyAnalytics" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."ActivityLog"   FORCE ROW LEVEL SECURITY;
ALTER TABLE public."SocialLink"    FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────
-- 2. SECURE VIEW: user_public (excludes password)
-- ──────────────────────────────────────────────
-- Drop existing view if it exists
DROP VIEW IF EXISTS public.user_public;

CREATE VIEW public.user_public AS
SELECT
  id,
  email,
  name,
  title,
  "avatarColor",
  "avatarUrl",
  "createdAt"
FROM public."User";

-- Revoke direct table SELECT from non-admin roles
REVOKE SELECT ON public."User" FROM anon, authenticated;
-- Grant SELECT on the safe view instead
GRANT SELECT ON public.user_public TO authenticated;


-- ──────────────────────────────────────────────
-- 3. USER TABLE POLICIES
-- ──────────────────────────────────────────────

-- SELECT: users can only read their own profile
CREATE POLICY "user_select_own"
  ON public."User" FOR SELECT
  USING (auth.uid()::text = id);

-- UPDATE: users can only update their own profile
CREATE POLICY "user_update_own"
  ON public."User" FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- No INSERT/DELETE on User (handled by Supabase Auth triggers or backend)


-- ──────────────────────────────────────────────
-- 4. TASK TABLE POLICIES
-- ──────────────────────────────────────────────

CREATE POLICY "task_select_own"
  ON public."Task" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "task_insert_own"
  ON public."Task" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "task_update_own"
  ON public."Task" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "task_delete_own"
  ON public."Task" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ──────────────────────────────────────────────
-- 5. PROJECT TABLE POLICIES
-- ──────────────────────────────────────────────

CREATE POLICY "project_select_own"
  ON public."Project" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "project_insert_own"
  ON public."Project" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "project_update_own"
  ON public."Project" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "project_delete_own"
  ON public."Project" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ──────────────────────────────────────────────
-- 6. COURSE TABLE POLICIES
-- ──────────────────────────────────────────────

CREATE POLICY "course_select_own"
  ON public."Course" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "course_insert_own"
  ON public."Course" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "course_update_own"
  ON public."Course" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "course_delete_own"
  ON public."Course" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ──────────────────────────────────────────────
-- 7. DAILY ANALYTICS TABLE POLICIES
-- ──────────────────────────────────────────────

CREATE POLICY "analytics_select_own"
  ON public."DailyAnalytics" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "analytics_insert_own"
  ON public."DailyAnalytics" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "analytics_update_own"
  ON public."DailyAnalytics" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "analytics_delete_own"
  ON public."DailyAnalytics" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ──────────────────────────────────────────────
-- 8. ACTIVITY LOG TABLE POLICIES
-- ──────────────────────────────────────────────

CREATE POLICY "activity_select_own"
  ON public."ActivityLog" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "activity_insert_own"
  ON public."ActivityLog" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- No UPDATE/DELETE on activity logs (append-only)


-- ──────────────────────────────────────────────
-- 9. SOCIAL LINK TABLE POLICIES
-- ──────────────────────────────────────────────

CREATE POLICY "social_select_own"
  ON public."SocialLink" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "social_insert_own"
  ON public."SocialLink" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "social_update_own"
  ON public."SocialLink" FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "social_delete_own"
  ON public."SocialLink" FOR DELETE
  USING (auth.uid()::text = "userId");


-- ============================================================
-- NOTES:
-- - Your Express backend connects as `postgres` / service_role
--   which BYPASSES RLS entirely. No backend changes needed.
-- - The auth.uid() policies activate when you integrate
--   Supabase Auth (auth.signUp / auth.signIn).
-- - The user_public view protects the password column from
--   being queried through Supabase API / PostgREST.
-- - FORCE ROW LEVEL SECURITY prevents table owners from
--   accidentally bypassing RLS.
-- ============================================================
