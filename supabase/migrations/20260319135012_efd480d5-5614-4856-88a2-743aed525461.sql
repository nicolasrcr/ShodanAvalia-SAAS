DROP POLICY IF EXISTS "Authenticated users can upload evaluation videos" ON storage.objects;

CREATE POLICY "Admins and moderators can upload evaluation videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evaluation-videos' AND
    (public.has_role(auth.uid(), 'admin'::public.app_role) OR
     public.has_role(auth.uid(), 'moderator'::public.app_role))
  );