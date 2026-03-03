import { useOfflineEvaluation } from '@/hooks/useOfflineEvaluation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudOff, RefreshCw, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateEvaluationPDF } from '@/utils/generateEvaluationPDF';
import { useToast } from '@/hooks/use-toast';

export function PendingSyncPanel() {
  const { getPendingEvaluations, syncPending, isSyncing } = useOfflineEvaluation();
  const { toast } = useToast();
  const pending = getPendingEvaluations();

  if (pending.length === 0) return null;

  const statusBadge = (status: string) => {
    if (status === 'aprovado') return <Badge className="bg-success text-success-foreground text-xs">Aprovado</Badge>;
    if (status === 'reprovado') return <Badge variant="destructive" className="text-xs">Reprovado</Badge>;
    return <Badge variant="secondary" className="text-xs">Pendente</Badge>;
  };

  const syncBadge = (syncStatus: string, error?: string) => {
    if (syncStatus === 'pending') return <Badge className="bg-yellow-600 text-white text-xs">Aguardando</Badge>;
    if (syncStatus === 'syncing') return <Badge className="bg-blue-600 text-white text-xs animate-pulse">Sincronizando...</Badge>;
    if (syncStatus === 'error') return <Badge variant="destructive" className="text-xs" title={error}>Erro</Badge>;
    if (syncStatus === 'synced') return <Badge className="bg-success text-success-foreground text-xs">Sincronizado</Badge>;
    return null;
  };

  const handleExportPDF = async (ev: typeof pending[0]) => {
    const data = ev.evaluation_data;
    await generateEvaluationPDF({
      candidateName: ev.candidate_name,
      targetGrade: ev.target_grade,
      evaluatorName: (data.evaluator_name as string) || '',
      evaluatorGrade: (data.evaluator_grade as string) || '',
      evaluationDate: (data.evaluation_date as string) || '',
      location: (data.location as string) || '',
      observations: (data.observations as string) || '',
      teoriaScores: [],
      praticaScores: [],
      notaTeorica: (data.nota_teorica_final as number) || 0,
      notaPratica: (data.nota_pratica_final as number) || 0,
      notaFinal: ev.nota_final,
      status: ev.status as 'aprovado' | 'reprovado' | 'pendente',
    });
    toast({ title: 'PDF gerado!' });
  };

  return (
    <Card className="border-yellow-600/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <CloudOff className="h-5 w-5 text-warning" />
          Avaliações Pendentes de Sincronização
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={syncPending}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar Agora
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.map(ev => (
          <div key={ev.temp_id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-secondary/30">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{ev.candidate_name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{ev.target_grade}</Badge>
                <span className="text-xs text-muted-foreground font-bold">{ev.nota_final.toFixed(2)}</span>
                {statusBadge(ev.status)}
                {syncBadge(ev.sync_status, ev.sync_error)}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(ev.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportPDF(ev)}>
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
