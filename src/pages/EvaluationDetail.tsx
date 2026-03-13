import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { translateError } from '@/utils/translateError';
import { VideoUploadSection } from '@/components/evaluation/VideoUploadSection';
import { ArrowLeft, FileDown, CheckCircle, XCircle, Clock, ShieldCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateEvaluationPDF } from '@/utils/generateEvaluationPDF';

const fieldLabels: Record<string, string> = {
  teoria_historico: 'Histórico',
  teoria_filosofia: 'Filosofia',
  teoria_etica: 'Ética e Disciplina',
  teoria_atualidades: 'Atualidades',
  teoria_tecnicas: 'Divisão e Classificação das Técnicas',
  teoria_vocabulario: 'Ortografia do Vocabulário Técnico',
  teoria_kata: 'Descrição Escrita sobre Kata',
  teoria_arbitragem: 'Conhecimento de Arbitragem',
  pratica_nage_no_kata: 'Nage no Kata',
  pratica_katame_no_kata: 'Katame no Kata',
  pratica_ju_no_kata: 'Ju no Kata',
  pratica_kime_no_kata: 'Kime no Kata',
  pratica_goshin_jutsu: 'Kodokan Goshin Jutsu',
  pratica_nage_waza: 'Nage Waza',
  pratica_renraku_waza: 'Renraku Waza / Henka Waza',
  pratica_kaeshi_waza: 'Kaeshi Waza',
  pratica_katame_waza: 'Katame Waza',
  pratica_arbitragem: 'Apresentação Prática de Arbitragem',
  pratica_pedagogia: 'Conhecimentos Didáticos e Pedagógicos',
};

const teoriaFields = Object.keys(fieldLabels).filter(k => k.startsWith('teoria_'));
const praticaFields = Object.keys(fieldLabels).filter(k => k.startsWith('pratica_'));

const VALIDATION_LABELS: Record<string, { label: string; className: string }> = {
  aguardando: { label: 'Aguardando Validação', className: 'bg-warning/10 text-warning border-warning/20' },
  validada: { label: 'Validada', className: 'bg-success/10 text-success border-success/20' },
  contestada: { label: 'Contestada', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  revisao: { label: 'Em Revisão', className: 'bg-primary/10 text-primary border-primary/20' },
};

export default function EvaluationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [panelScores, setPanelScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  async function fetchData() {
    const [evalRes, panelRes] = await Promise.all([
      supabase
        .from('evaluations')
        .select('*, candidates(full_name, federation, current_grade, target_grade, birth_date)')
        .eq('id', id!)
        .single(),
      supabase
        .from('evaluation_panel_scores')
        .select('*')
        .eq('evaluation_id', id!)
        .order('evaluator_number'),
    ]);

    if (evalRes.error) {
      toast({ title: 'Erro', description: evalRes.error.message, variant: 'destructive' });
    } else {
      setEvaluation(evalRes.data);
    }
    setPanelScores(panelRes.data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!evaluation) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Avaliação não encontrada.</p>
          <Button variant="outline" onClick={() => navigate('/evaluations')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado': return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'reprovado': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Reprovado</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const validationInfo = VALIDATION_LABELS[evaluation.validation_status] || VALIDATION_LABELS.aguardando;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/evaluations')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">
                {evaluation.candidates?.full_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {evaluation.target_grade} •{' '}
                {format(new Date(evaluation.evaluation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(evaluation.status)}
            <Badge variant="outline" className={validationInfo.className}>
              <ShieldCheck className="h-3 w-3 mr-1" />{validationInfo.label}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Dados da Avaliação</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Avaliador</span><p className="font-medium">{evaluation.evaluator_name}</p></div>
              <div><span className="text-muted-foreground">Graduação Avaliador</span><p className="font-medium">{evaluation.evaluator_grade}</p></div>
              <div><span className="text-muted-foreground">Local</span><p className="font-medium">{evaluation.location || '-'}</p></div>
              <div><span className="text-muted-foreground">Modo</span><p className="font-medium capitalize">{evaluation.exam_mode || 'presencial'}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Prova Teórica</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teoriaFields.map(f => {
                  const val = evaluation[f];
                  if (val == null) return null;
                  return (
                    <div key={f} className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-sm">{fieldLabels[f]}</span>
                      <span className="font-mono font-bold">{Number(val).toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-2 bg-secondary rounded flex justify-between">
                <span className="font-medium">Média Teórica</span>
                <span className="font-bold">{evaluation.nota_teorica_final?.toFixed(2) || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Prova Prática</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {praticaFields.map(f => {
                  const val = evaluation[f];
                  if (val == null) return null;
                  return (
                    <div key={f} className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-sm">{fieldLabels[f]}</span>
                      <span className="font-mono font-bold">{Number(val).toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-2 bg-secondary rounded flex justify-between">
                <span className="font-medium">Média Prática</span>
                <span className="font-bold">{evaluation.nota_pratica_final?.toFixed(2) || '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final Score */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Nota Final</span>
              <span className="text-4xl font-bold text-primary">{evaluation.nota_final?.toFixed(2) || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Panel Scores */}
        {panelScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Notas da Banca ({panelScores.length} avaliadores)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {panelScores.map(ps => (
                  <Card key={ps.id} className="bg-secondary/30">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Avaliador {ps.evaluator_number}
                        </Badge>
                        <span className="text-lg font-bold">{ps.nota_final?.toFixed(2) || '-'}</span>
                      </div>
                      <p className="font-medium text-sm">{ps.evaluator_name}</p>
                      <p className="text-xs text-muted-foreground">{ps.evaluator_grade}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Teórica: </span><span className="font-bold">{ps.nota_teorica_final?.toFixed(2) || '-'}</span></div>
                        <div><span className="text-muted-foreground">Prática: </span><span className="font-bold">{ps.nota_pratica_final?.toFixed(2) || '-'}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observations */}
        {evaluation.observations && (
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Observações</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{evaluation.observations}</p></CardContent>
          </Card>
        )}

        {/* Validation Notes */}
        {evaluation.validation_notes && (
          <Card className="border-primary/20">
            <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />Notas de Validação
            </CardTitle></CardHeader>
            <CardContent><p className="text-sm">{evaluation.validation_notes}</p></CardContent>
          </Card>
        )}

        {/* Videos */}
        <VideoUploadSection evaluationId={evaluation.id} readOnly />
      </div>
    </MainLayout>
  );
}
