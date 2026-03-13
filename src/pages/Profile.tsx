import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, TrendingUp, 
  BarChart3, Target, FileText 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EvaluationWithCandidate {
  id: string;
  evaluation_date: string;
  target_grade: string;
  status: string;
  nota_final: number | null;
  validation_status: string;
  candidates: { full_name: string } | null;
}

interface ProfileStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
  monthlyCount: Record<string, number>;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationWithCandidate[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ total: 0, approved: 0, rejected: 0, pending: 0, averageScore: 0, gradeDistribution: {}, monthlyCount: {} });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!user) return;
    setUserName(user.user_metadata?.full_name || user.email || 'Avaliador');

    async function fetchData() {
      const { data } = await supabase
        .from('evaluations')
        .select('id, evaluation_date, target_grade, status, nota_final, validation_status, candidates(full_name)')
        .eq('created_by', user!.id)
        .order('evaluation_date', { ascending: false });

      const evals = (data || []) as unknown as EvaluationWithCandidate[];
      setEvaluations(evals);

      const approved = evals.filter(e => e.status === 'aprovado').length;
      const rejected = evals.filter(e => e.status === 'reprovado').length;
      const pending = evals.filter(e => e.status === 'pendente').length;
      const scores = evals.filter(e => e.nota_final != null).map(e => e.nota_final!);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      const gradeDistribution: Record<string, number> = {};
      evals.forEach(e => {
        gradeDistribution[e.target_grade] = (gradeDistribution[e.target_grade] || 0) + 1;
      });

      const monthlyCount: Record<string, number> = {};
      evals.forEach(e => {
        const month = format(new Date(e.evaluation_date), 'MMM/yy', { locale: ptBR });
        monthlyCount[month] = (monthlyCount[month] || 0) + 1;
      });

      setStats({ total: evals.length, approved, rejected, pending, averageScore, gradeDistribution, monthlyCount });
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado': return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'reprovado': return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Reprovado</Badge>;
      default: return <Badge className="bg-warning/20 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const getValidationBadge = (status: string) => {
    switch (status) {
      case 'validada': return <Badge variant="outline" className="border-success/40 text-success">Validada</Badge>;
      case 'contestada': return <Badge variant="outline" className="border-destructive/40 text-destructive">Contestada</Badge>;
      case 'revisao': return <Badge variant="outline" className="border-warning/40 text-warning">Em Revisão</Badge>;
      default: return <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">Aguardando</Badge>;
    }
  };

  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold text-foreground">{userName}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Avaliações</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{approvalRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Aprovação</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{stats.averageScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Nota Média</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold text-success">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Reprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Taxa de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={approvalRate} className="flex-1 h-3" />
              <span className="text-lg font-bold text-primary">{approvalRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        {Object.keys(stats.gradeDistribution).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Distribuição por Grau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.gradeDistribution).sort().map(([grade, count]) => (
                  <div key={grade} className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-foreground">{grade}</p>
                    <p className="text-2xl font-bold text-primary">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evaluations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Suas Avaliações</CardTitle>
            <CardDescription>Histórico completo das suas avaliações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : evaluations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma avaliação registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Candidato</TableHead>
                    <TableHead>Grau</TableHead>
                    <TableHead>Nota Final</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map(ev => (
                    <TableRow 
                      key={ev.id} 
                      className="cursor-pointer hover:bg-primary/5"
                      onClick={() => navigate(`/evaluations/${ev.id}`)}
                    >
                      <TableCell>{format(new Date(ev.evaluation_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{ev.candidates?.full_name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{ev.target_grade}</Badge></TableCell>
                      <TableCell className="font-mono">{ev.nota_final != null ? ev.nota_final.toFixed(1) : '—'}</TableCell>
                      <TableCell>{getStatusBadge(ev.status)}</TableCell>
                      <TableCell>{getValidationBadge(ev.validation_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
