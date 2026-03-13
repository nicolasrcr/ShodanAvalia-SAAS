import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CandidateWithEvaluations {
  id: string;
  full_name: string;
  federation: string;
  current_grade: string;
  target_grade: string;
  evaluations: {
    id: string;
    evaluation_date: string;
    target_grade: string;
    nota_final: number | null;
    status: string;
    evaluator_name: string;
  }[];
}

export default function HistoryPage() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<CandidateWithEvaluations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        id,
        full_name,
        federation,
        current_grade,
        target_grade,
        evaluations (
          id,
          evaluation_date,
          target_grade,
          nota_final,
          status,
          evaluator_name
        )
      `)
      .order('full_name');
    
    if (error) {
      toast({
        title: 'Erro ao carregar histórico',
        description: translateError(error.message),
        variant: 'destructive',
      });
    } else {
      setCandidates(data as CandidateWithEvaluations[] || []);
    }
    setLoading(false);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'reprovado':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.federation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const candidatesWithHistory = filteredCandidates.filter(c => c.evaluations && c.evaluations.length > 0);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Histórico de Avaliações
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe a evolução de cada candidato ao longo das graduações
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar candidato..."
            className="pl-10"
          />
        </div>

        {/* History Cards */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Carregando histórico...
            </CardContent>
          </Card>
        ) : candidatesWithHistory.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? 'Nenhum candidato encontrado.' : 'Nenhum histórico de avaliações disponível.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {candidatesWithHistory.map((candidate) => (
              <Card key={candidate.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="font-display text-xl">
                      {candidate.full_name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{candidate.federation}</Badge>
                      <Badge className="bg-accent text-accent-foreground">
                        {candidate.current_grade}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Timeline */}
                    <div className="relative pl-6 border-l-2 border-border space-y-4">
                      {candidate.evaluations
                        .sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime())
                        .map((evaluation, idx) => (
                          <div key={evaluation.id} className="relative">
                            {/* Timeline dot */}
                            <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-background border-2 border-accent flex items-center justify-center">
                              {getStatusIcon(evaluation.status)}
                            </div>
                            
                            <div className="bg-secondary/50 rounded-lg p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold">
                                    Exame para {evaluation.target_grade}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(evaluation.evaluation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {evaluation.nota_final !== null && (
                                    <div className="text-right">
                                      <span className="text-xs text-muted-foreground">Nota</span>
                                      <p className="text-lg font-bold">{evaluation.nota_final.toFixed(2)}</p>
                                    </div>
                                  )}
                                  <Badge 
                                    variant={
                                      evaluation.status === 'aprovado' ? 'default' : 
                                      evaluation.status === 'reprovado' ? 'destructive' : 'secondary'
                                    }
                                    className={evaluation.status === 'aprovado' ? 'bg-success' : ''}
                                  >
                                    {evaluation.status.charAt(0).toUpperCase() + evaluation.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mt-2">
                                Avaliador: {evaluation.evaluator_name}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {candidate.evaluations.length} avaliação(ões)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-muted-foreground">
                          {candidate.evaluations.filter(e => e.status === 'aprovado').length} aprovação(ões)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
