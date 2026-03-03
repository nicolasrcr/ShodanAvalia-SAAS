
-- Tabela para armazenar metadados dos videos de avaliacao
CREATE TABLE public.evaluation_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'prova_pratica',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_evaluation_videos_evaluation_id ON public.evaluation_videos(evaluation_id);
CREATE INDEX idx_evaluation_videos_uploaded_by ON public.evaluation_videos(uploaded_by);

-- RLS
ALTER TABLE public.evaluation_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evaluation videos"
  ON public.evaluation_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and moderators can insert evaluation videos"
  ON public.evaluation_videos FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Uploaders and admins can delete evaluation videos"
  ON public.evaluation_videos FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('evaluation-videos', 'evaluation-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload evaluation videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evaluation-videos');

CREATE POLICY "Authenticated users can view evaluation videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evaluation-videos');

CREATE POLICY "Admins can delete evaluation videos from storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evaluation-videos' AND public.has_role(auth.uid(), 'admin'::app_role));
