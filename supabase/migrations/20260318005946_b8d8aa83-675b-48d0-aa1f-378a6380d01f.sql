
-- Fix theoretical_questions: restrict SELECT to admin/moderator only (hides correct_answer from regular users)
DROP POLICY IF EXISTS "Authenticated users can view theoretical questions" ON public.theoretical_questions;

CREATE POLICY "Admins and moderators can view theoretical questions"
  ON public.theoretical_questions
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- Fix candidates: restrict SELECT to admin/moderator only (protects email and birth_date PII)
DROP POLICY IF EXISTS "Authenticated users can view candidates" ON public.candidates;

CREATE POLICY "Admins and moderators can view candidates"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  );
