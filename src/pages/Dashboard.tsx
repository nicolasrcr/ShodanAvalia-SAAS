import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  ClipboardList, 
  CheckCircle, 
  XCircle,
  Plus,
  TrendingUp,
  Target,
  Award,
  FileDown
} from 'lucide-react';
import { generateStatsReportPDF } from '@/utils/generateReportsPDF';
import { PendingSyncPanel } from '@/components/evaluation/PendingSyncPanel';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface Stats {
  totalCandidates: number;
  totalEvaluations: number;
  approved: number;
  pending: number;
  rejected: number;
  averageScore: number;
}

interface EvaluationData {
  status: string;
  target_grade: string;
  nota_final: number | null;
  evaluation_date: string;
}

interface GradeStats {
  grade: string;
  total: number;
  approved: number;
  rejected: number;
  averageScore: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalCandidates: 0,
    totalEvaluations: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageScore: 0,
  });
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; aprovados: number; reprovados: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [candidatesRes, evaluationsRes] = await Promise.all([
          supabase.from('candidates').select('id', { count: 'exact', head: true }),
          supabase.from('evaluations').select('status, target_grade, nota_final, evaluation_date'),
        ]);

        const evaluations = (evaluationsRes.data || []) as EvaluationData[];
        
        // Calculate basic stats
        const approved = evaluations.filter(e => e.status === 'aprovado').length;
        const rejected = evaluations.filter(e => e.status === 'reprovado').length;
        const pending = evaluations.filter(e => e.status === 'pendente').length;
        
        const scoresWithValues = evaluations
          .filter(e => e.nota_final !== null)
          .map(e => e.nota_final as number);
        const averageScore = scoresWithValues.length > 0 
          ? scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length 
          : 0;

        setStats({
          totalCandidates: candidatesRes.count || 0,
          totalEvaluations: evaluations.length,
          approved,
          pending,
          rejected,
          averageScore,
        });

        // Calculate stats by grade
        const gradeMap = new Map<string, { total: number; approved: number; rejected: number; scores: number[] }>();
        
        evaluations.forEach(e => {
          const current = gradeMap.get(e.target_grade) || { total: 0, approved: 0, rejected: 0, scores: [] };
          current.total++;
          if (e.status === 'aprovado') current.approved++;
          if (e.status === 'reprovado') current.rejected++;
          if (e.nota_final !== null) current.scores.push(e.nota_final);
          gradeMap.set(e.target_grade, current);
        });

        const gradeStatsArray: GradeStats[] = [];
        ['1º DAN', '2º DAN', '3º DAN', '4º DAN', '5º DAN'].forEach(grade => {
          const data = gradeMap.get(grade);
          if (data) {
            gradeStatsArray.push({
              grade: grade.replace('º DAN', ''),
              total: data.total,
              approved: data.approved,
              rejected: data.rejected,
              averageScore: data.scores.length > 0 
                ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
                : 0,
            });
          } else {
            gradeStatsArray.push({
              grade: grade.replace('º DAN', ''),
              total: 0,
              approved: 0,
              rejected: 0,
              averageScore: 0,
            });
          }
        });
        setGradeStats(gradeStatsArray);

        // Calculate monthly data (last 6 months)
        const monthlyMap = new Map<string, { aprovados: number; reprovados: number }>();
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          monthlyMap.set(monthKey, { aprovados: 0, reprovados: 0 });
        }

        evaluations.forEach(e => {
          const date = new Date(e.evaluation_date);
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          const current = monthlyMap.get(monthKey);
          if (current) {
            if (e.status === 'aprovado') current.aprovados++;
            if (e.status === 'reprovado') current.reprovados++;
          }
        });

        const monthlyDataArray = Array.from(monthlyMap.entries()).map(([month, data]) => ({
          month,
          ...data,
        }));
        setMonthlyData(monthlyDataArray);

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'Candidatos', 
      value: stats.totalCandidates, 
      icon: Users, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      title: 'Avaliações', 
      value: stats.totalEvaluations, 
      icon: ClipboardList, 
      color: 'text-accent',
      bg: 'bg-accent/10'
    },
    { 
      title: 'Aprovados', 
      value: stats.approved, 
      icon: CheckCircle, 
      color: 'text-success',
      bg: 'bg-success/10'
    },
    { 
      title: 'Pendentes', 
      value: stats.pending, 
      icon: TrendingUp, 
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
  ];

  const pieData = [
    { name: 'Aprovados', value: stats.approved, color: 'hsl(142, 76%, 36%)' },
    { name: 'Reprovados', value: stats.rejected, color: 'hsl(0, 84%, 60%)' },
    { name: 'Pendentes', value: stats.pending, color: 'hsl(45, 93%, 47%)' },
  ].filter(d => d.value > 0);

  const approvalRate = stats.totalEvaluations > 0 
    ? ((stats.approved / stats.totalEvaluations) * 100).toFixed(1) 
    : '0';

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Pending Sync Panel */}
        <PendingSyncPanel />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Painel de Controle
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie avaliações de graduação do 1º ao 5º DAN
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                generateStatsReportPDF({
                  ...stats,
                  approvalRate: parseFloat(approvalRate),
                  gradeStats: gradeStats.map(g => ({
                    grade: g.grade,
                    total: g.total,
                    approved: g.approved,
                    averageScore: g.averageScore,
                  })),
                });
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button 
              onClick={() => navigate('/new-evaluation')}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/20">
                  <Award className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                  <p className="text-2xl font-bold text-success">{approvalRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/20">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nota Média</p>
                  <p className="text-2xl font-bold text-accent">
                    {loading ? '...' : stats.averageScore.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/20">
                  <XCircle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reprovações</p>
                  <p className="text-2xl font-bold text-warning">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Avaliações por Grau */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Avaliações por Graduação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="grade" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}º DAN`}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value, name) => [value, name === 'approved' ? 'Aprovados' : 'Reprovados']}
                      labelFormatter={(label) => `${label}º DAN`}
                    />
                    <Legend formatter={(value) => value === 'approved' ? 'Aprovados' : 'Reprovados'} />
                    <Bar dataKey="approved" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Distribuição de Status */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Sem dados para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Chart - Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="aprovados" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142, 76%, 36%)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reprovados" 
                    stroke="hsl(0, 84%, 60%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(0, 84%, 60%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution by Grade */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Média de Notas por Graduação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {gradeStats.map((grade) => (
                <div 
                  key={grade.grade} 
                  className="text-center p-4 rounded-lg bg-secondary"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold mb-2">
                    {grade.grade}º
                  </div>
                  <p className="text-2xl font-bold">
                    {grade.averageScore > 0 ? grade.averageScore.toFixed(1) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {grade.total} avaliação(ões)
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/candidates')}
              >
                <Users className="h-4 w-4 mr-3" />
                Gerenciar Candidatos
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/new-evaluation')}
              >
                <ClipboardList className="h-4 w-4 mr-3" />
                Iniciar Nova Avaliação
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/programs')}
              >
                <CheckCircle className="h-4 w-4 mr-3" />
                Ver Programas de Faixa
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Graduações Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['1º DAN', '2º DAN', '3º DAN', '4º DAN', '5º DAN'].map((grade, idx) => {
                  const gradeData = gradeStats[idx];
                  return (
                    <div 
                      key={grade} 
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-primary" />
                        <span className="font-medium">{grade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {gradeData?.total || 0} avaliação(ões)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-primary to-gray-800 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-display font-semibold">
                  Sistema de Avaliação CBJ
                </h3>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Baseado no Regulamento de Exame e Outorga de Faixas e Graus de 2018
                </p>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/programs')}
              >
                Ver Requisitos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
