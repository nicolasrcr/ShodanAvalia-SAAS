import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { VideoUploadSection } from '@/components/evaluation/VideoUploadSection';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ValidationEvaluation {
  id: string;
  evaluation_date: string;
  target_grade: string;
  evaluator_name: string;
  nota_final: number | null;
  nota_teorica_final: number | null;
  nota_pratica_final: number | null;
  status: string;
  validation_status: string;
  validation_notes: string | null;
  observations: string | null;
  location: string | null;
  candidates: {
    full_name: string;
    federation: string;
  } | null;
}

const VALIDATION_STATUSES = [
  { value: 'aguardando', label: 'Aguardando', icon: Clock, color: 'bg-warning/10 text-warning border-warning/20' },
  { value: 'validada', label: 'Validada', icon: CheckCircle, color: 'bg-success/10 text-success border-success/20' },
  { value: 'contestada', label: 'Contestada', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { value: 'revisao', label: 'Em Revisão', icon: Eye, color: 'bg-primary/10 text-primary border-primary/20' },
];

export default function Validations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [evaluations, setEvaluations] = useState<ValidationEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEval, setSelectedEval] = useState<ValidationEvaluation | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionType, setActionType] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        id, evaluation_date, target_grade, evaluator_name,
        nota_final, nota_teorica_final, nota_pratica_final,
        status, validation_status, validation_notes, observations, location,
        candidates (full_name, federation)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setEvaluations((data as any[]) || []);
    }
    setLoading(false);
  }

  const handleValidationAction = async (newStatus: string) => {
    if (!selectedEval || !user) return;
    setProcessing(true);

    const { error } = await supabase
      .from('evaluations')
      .update({
        validation_status: newStatus,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
        validation_notes: actionNotes || null,
      })
      .eq('id', selectedEval.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status atualizado', description: `Avaliação marcada como "${newStatus}".` });
      setSelectedEval(null);
      setActionNotes('');
      fetchEvaluations();
    }
    setProcessing(false);
  };

  const getValidationBadge = (status: string) => {
    const found = VALIDATION_STATUSES.find(s => s.value === status);
    if (!found) return <Badge variant="secondary">{status}</Badge>;
    const Icon = found.icon;
    return (
      <Badge variant="outline" className={found.color}>
        <Icon className="h-3 w-3 mr-1" />{found.label}
      </Badge>
    );
  };

  const filteredEvaluations = filterStatus === 'all'
    ? evaluations
    : evaluations.filter(e => e.validation_status === filterStatus);

  const counts = {
    all: evaluations.length,
    aguardando: evaluations.filter(e => e.validation_status === 'aguardando').length,
    validada: evaluations.filter(e => e.validation_status === 'validada').length,
    contestada: evaluations.filter(e => e.validation_status === 'contestada').length,
    revisao: evaluations.filter(e => e.validation_status === 'revisao').length,
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card><CardContent className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Acesso restrito a administradores.</p>
          </CardContent></Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Validação de Avaliações
          </h1>
          <p className="text-muted-foreground mt-1">
            Revise e valide as súmulas enviadas pelos avaliadores
          </p>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { value: 'all', label: 'Todas', icon: Filter, color: '' },
            ...VALIDATION_STATUSES,
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setFilterStatus(item.value)}
              className={`p-3 rounded-lg border text-center transition-all ${
                filterStatus === item.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/30 hover:bg-secondary/50'
              }`}
            >
              <p className="text-2xl font-bold">{counts[item.value as keyof typeof counts] || 0}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </button>
          ))}
        </div>

        {/* Evaluations List */}
        <div className="space-y-3">
          {loading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
          ) : filteredEvaluations.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma avaliação encontrada.</CardContent></Card>
          ) : (
            filteredEvaluations.map(evaluation => (
              <Card
                key={evaluation.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setSelectedEval(evaluation); setActionNotes(evaluation.validation_notes || ''); }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {evaluation.target_grade.split(' ')[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{evaluation.candidates?.full_name || 'Candidato'}</h3>
                        <p className="text-xs text-muted-foreground">
                          {evaluation.target_grade} • {format(new Date(evaluation.evaluation_date), 'dd/MM/yyyy', { locale: ptBR })}
                          {evaluation.location && ` • ${evaluation.location}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {evaluation.nota_final !== null && (
                        <span className="font-bold text-lg">{evaluation.nota_final.toFixed(2)}</span>
                      )}
                      {getValidationBadge(evaluation.validation_status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Validation Dialog */}
      <Dialog open={!!selectedEval} onOpenChange={(open) => { if (!open) setSelectedEval(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedEval && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Validar: {selectedEval.candidates?.full_name} — {selectedEval.target_grade}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data</span>
                    <p className="font-medium">{format(new Date(selectedEval.evaluation_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avaliador</span>
                    <p className="font-medium">{selectedEval.evaluator_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Local</span>
                    <p className="font-medium">{selectedEval.location || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nota Teórica</span>
                    <p className="font-medium">{selectedEval.nota_teorica_final?.toFixed(2) || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nota Prática</span>
                    <p className="font-medium">{selectedEval.nota_pratica_final?.toFixed(2) || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nota Final</span>
                    <p className="text-xl font-bold">{selectedEval.nota_final?.toFixed(2) || '-'}</p>
                  </div>
                </div>

                {/* Current Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status atual:</span>
                  {getValidationBadge(selectedEval.validation_status)}
                </div>

                {selectedEval.observations && (
                  <div className="p-3 bg-secondary rounded-lg">
                    <span className="text-xs text-muted-foreground">Observações do avaliador:</span>
                    <p className="text-sm mt-1">{selectedEval.observations}</p>
                  </div>
                )}

                {/* Videos */}
                <VideoUploadSection evaluationId={selectedEval.id} readOnly />

                {/* Validation Notes */}
                <div>
                  <span className="text-sm font-medium">Notas de Validação</span>
                  <Textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Observações sobre a validação..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleValidationAction('revisao')}
                  disabled={processing}
                >
                  <Eye className="h-4 w-4 mr-2" />Em Revisão
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleValidationAction('contestada')}
                  disabled={processing}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />Contestar
                </Button>
                <Button
                  className="bg-success hover:bg-success/90"
                  onClick={() => handleValidationAction('validada')}
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />Validar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
