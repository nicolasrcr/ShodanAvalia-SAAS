import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, XCircle, Clock, FileDown, Video } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateEvaluationsReportPDF } from '@/utils/generateReportsPDF';
import { VideoUploadSection } from '@/components/evaluation/VideoUploadSection';

interface EvaluationWithCandidate {
  id: string;
  evaluation_date: string;
  target_grade: string;
  evaluator_name: string;
  nota_final: number | null;
  nota_teorica_final: number | null;
  nota_pratica_final: number | null;
  status: 'pendente' | 'aprovado' | 'reprovado';
  candidates: {
    full_name: string;
    federation: string;
  } | null;
}

export default function EvaluationsPage() {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<EvaluationWithCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithCandidate | null>(null);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        id,
        evaluation_date,
        target_grade,
        evaluator_name,
        nota_final,
        nota_teorica_final,
        nota_pratica_final,
        status,
        candidates (
          full_name,
          federation
        )
      `)
      .order('evaluation_date', { ascending: false });
    
    if (error) {
      toast({ title: 'Erro ao carregar avaliações', description: error.message, variant: 'destructive' });
    } else {
      setEvaluations(data as EvaluationWithCandidate[] || []);
      // Fetch video counts
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
                onClick={() => setSelectedEvaluation(evaluation)}
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
                    <div className="flex items-center gap-4">
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
                      {getStatusBadge(evaluation.status)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <span>Avaliador: {evaluation.evaluator_name}</span>
                    {evaluation.candidates?.federation && <span>{evaluation.candidates.federation}</span>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Evaluation Detail Dialog */}
      <Dialog open={!!selectedEvaluation} onOpenChange={(open) => !open && setSelectedEvaluation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEvaluation && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {selectedEvaluation.candidates?.full_name} — {selectedEvaluation.target_grade}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <p className="font-medium">
                      {format(new Date(selectedEvaluation.evaluation_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avaliador:</span>
                    <p className="font-medium">{selectedEvaluation.evaluator_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nota Teórica:</span>
                    <p className="font-medium">{selectedEvaluation.nota_teorica_final?.toFixed(2) || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nota Prática:</span>
                    <p className="font-medium">{selectedEvaluation.nota_pratica_final?.toFixed(2) || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nota Final:</span>
                    <p className="text-xl font-bold">{selectedEvaluation.nota_final?.toFixed(2) || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedEvaluation.status)}</div>
                  </div>
                </div>
                <VideoUploadSection evaluationId={selectedEvaluation.id} readOnly />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
