
-- Add validation workflow and multi-evaluator support to evaluations
ALTER TABLE public.evaluations 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'aguardando',
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validation_notes TEXT,
  ADD COLUMN IF NOT EXISTS exam_mode TEXT NOT NULL DEFAULT 'presencial';

-- Create index for validation queries
CREATE INDEX IF NOT EXISTS idx_evaluations_validation_status ON public.evaluations(validation_status);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_by ON public.evaluations(created_by);

-- Panel scores table for multi-evaluator support (banca with 3 evaluators)
CREATE TABLE public.evaluation_panel_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  evaluator_number INTEGER NOT NULL CHECK (evaluator_number BETWEEN 1 AND 3),
  evaluator_name TEXT NOT NULL,
  evaluator_grade TEXT NOT NULL,
  -- Theoretical scores
  teoria_historico NUMERIC,
  teoria_filosofia NUMERIC,
  teoria_etica NUMERIC,
  teoria_atualidades NUMERIC,
  teoria_tecnicas NUMERIC,
  teoria_vocabulario NUMERIC,
  teoria_kata NUMERIC,
  teoria_arbitragem NUMERIC,
  -- Practical scores
  pratica_nage_no_kata NUMERIC,
  pratica_katame_no_kata NUMERIC,
  pratica_ju_no_kata NUMERIC,
  pratica_kime_no_kata NUMERIC,
  pratica_goshin_jutsu NUMERIC,
  pratica_nage_waza NUMERIC,
  pratica_renraku_waza NUMERIC,
  pratica_kaeshi_waza NUMERIC,
  pratica_katame_waza NUMERIC,
  pratica_arbitragem NUMERIC,
  pratica_pedagogia NUMERIC,
  -- Computed
  nota_teorica_final NUMERIC,
  nota_pratica_final NUMERIC,
  nota_final NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, evaluator_number)
);

CREATE INDEX idx_panel_scores_evaluation_id ON public.evaluation_panel_scores(evaluation_id);

-- RLS for panel scores
ALTER TABLE public.evaluation_panel_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view panel scores"
  ON public.evaluation_panel_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and moderators can insert panel scores"
  ON public.evaluation_panel_scores FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can update panel scores"
  ON public.evaluation_panel_scores FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete panel scores"
  ON public.evaluation_panel_scores FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
