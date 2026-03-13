import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, XCircle, Clock, FileDown, Video, ShieldCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateEvaluationsReportPDF } from '@/utils/generateReportsPDF';

interface EvaluationWithCandidate {
  id: string;
  evaluation_date: string;
  target_grade: string;
  evaluator_name: string;
  nota_final: number | null;
  nota_teorica_final: number | null;
  nota_pratica_final: number | null;
  status: string;
  validation_status: string;
  candidates: {
    full_name: string;
    federation: string;
  } | null;
}

const VALIDATION_BADGES: Record<string, { label: string; className: string }> = {
  aguardando: { label: 'Aguardando', className: 'bg-warning/10 text-warning border-warning/20' },
  validada: { label: 'Validada', className: 'bg-success/10 text-success border-success/20' },
  contestada: { label: 'Contestada', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  revisao: { label: 'Em Revisão', className: 'bg-primary/10 text-primary border-primary/20' },
};

export default function EvaluationsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationWithCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        id, evaluation_date, target_grade, evaluator_name,
        nota_final, nota_teorica_final, nota_pratica_final,
        status, validation_status,
        candidates (full_name, federation)
      `)
      .order('evaluation_date', { ascending: false });
    
    if (error) {
      toast({ title: 'Erro ao carregar avaliações', description: translateError(error.message), variant: 'destructive' });
    } else {
      setEvaluations(data as EvaluationWithCandidate[] || []);
      const { data: videos } = await supabase
        .from('evaluation_videos')
        .select('evaluation_id');
      if (videos) {
        const counts: Record<string, number> = {};
        videos.forEach((v: any) => {
          counts[v.evaluation_id] = (counts[v.evaluation_id] || 0) + 1;
        });
        setVideoCounts(counts);
      }
    }
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'reprovado':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Reprovado</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const getValidationBadge = (status: string) => {
    const info = VALIDATION_BADGES[status];
    if (!info) return null;
    return (
      <Badge variant="outline" className={info.className}>
        <ShieldCheck className="h-3 w-3 mr-1" />{info.label}
      </Badge>
    );
  };

  const filteredEvaluations = evaluations.filter(e => 
    e.candidates?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.target_grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.evaluator_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    const reportData = filteredEvaluations.map(e => ({
      candidate_name: e.candidates?.full_name || 'Candidato',
      target_grade: e.target_grade,
      evaluator_name: e.evaluator_name,
      evaluation_date: e.evaluation_date,
      nota_teorica: 0,
      nota_pratica: 0,
      nota_final: e.nota_final || 0,
      status: e.status,
    }));
    generateEvaluationsReportPDF(reportData);
    toast({ title: 'PDF Gerado!', description: 'Relatório de avaliações exportado com sucesso.' });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Avaliações</h1>
            <p className="text-muted-foreground mt-1">Histórico de avaliações realizadas</p>
          </div>
          <Button variant="outline" onClick={handleExportPDF} disabled={filteredEvaluations.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />Exportar PDF
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por candidato, graduação ou avaliador..." className="pl-10" />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando avaliações...</CardContent></Card>
          ) : filteredEvaluations.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">{searchTerm ? 'Nenhuma avaliação encontrada.' : 'Nenhuma avaliação realizada.'}</CardContent></Card>
          ) : (
            filteredEvaluations.map((evaluation) => (
              <Card 
                key={evaluation.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/evaluations/${evaluation.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-display font-bold">
                        {evaluation.target_grade.split(' ')[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{evaluation.candidates?.full_name || 'Candidato'}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{evaluation.target_grade}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(evaluation.evaluation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {videoCounts[evaluation.id] > 0 && (
                        <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          {videoCounts[evaluation.id]} vídeo{videoCounts[evaluation.id] > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {evaluation.nota_final !== null && (
                        <div className="text-right hidden sm:block">
                          <span className="text-xs text-muted-foreground">Nota Final</span>
                          <p className="text-xl font-bold">{evaluation.nota_final.toFixed(2)}</p>
                        </div>
                      )}
                      {getValidationBadge(evaluation.validation_status)}
                      {getStatusBadge(evaluation.status)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <span>Avaliador: {evaluation.evaluator_name}</span>
                    <div className="flex items-center gap-2">
                      {evaluation.candidates?.federation && <span>{evaluation.candidates.federation}</span>}
                      <Eye className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
