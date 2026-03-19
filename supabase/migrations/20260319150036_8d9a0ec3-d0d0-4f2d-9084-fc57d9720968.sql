DROP POLICY IF EXISTS "Authenticated users can view evaluations" ON public.evaluations;

CREATE POLICY "Admins moderators and creators can view evaluations"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
    OR created_by = auth.uid()
  );