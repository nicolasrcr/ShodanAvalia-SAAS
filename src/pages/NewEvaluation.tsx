import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineEvaluation } from '@/hooks/useOfflineEvaluation';
import { GRADE_OPTIONS } from '@/types/evaluation';
import { CheckCircle, XCircle, Save, FileDown, Video, AlertCircle } from 'lucide-react';
import { generateEvaluationPDF } from '@/utils/generateEvaluationPDF';
import { PracticalSectionScoring, type GroupTechniqueScore } from '@/components/evaluation/PracticalSectionScoring';
import { VideoUploadSection } from '@/components/evaluation/VideoUploadSection';
import { PanelScoringSection } from '@/components/evaluation/PanelScoringSection';

interface EvaluationFields {
  // Teoria
  teoria_historico: string;
  teoria_filosofia: string;
  teoria_etica: string;
  teoria_atualidades: string;
  teoria_tecnicas: string;
  teoria_vocabulario: string;
  teoria_kata: string;
  teoria_arbitragem: string;
  // Prática
  pratica_nage_no_kata: string;
  pratica_katame_no_kata: string;
  pratica_ju_no_kata: string;
  pratica_kime_no_kata: string;
  pratica_goshin_jutsu: string;
  pratica_nage_waza: string;
  pratica_renraku_waza: string;
  pratica_kaeshi_waza: string;
  pratica_katame_waza: string;
  pratica_arbitragem: string;
  pratica_pedagogia: string;
}

const initialFields: EvaluationFields = {
  teoria_historico: '',
  teoria_filosofia: '',
  teoria_etica: '',
  teoria_atualidades: '',
  teoria_tecnicas: '',
  teoria_vocabulario: '',
  teoria_kata: '',
  teoria_arbitragem: '',
  pratica_nage_no_kata: '',
  pratica_katame_no_kata: '',
  pratica_ju_no_kata: '',
  pratica_kime_no_kata: '',
  pratica_goshin_jutsu: '',
  pratica_nage_waza: '',
  pratica_renraku_waza: '',
  pratica_kaeshi_waza: '',
  pratica_katame_waza: '',
  pratica_arbitragem: '',
  pratica_pedagogia: '',
};

// Configuração dos campos por DAN
const getFieldsByGrade = (grade: string) => {
  const baseTeoria = ['teoria_historico', 'teoria_filosofia', 'teoria_etica', 'teoria_tecnicas', 'teoria_vocabulario'];
  const basePratica = ['pratica_nage_waza', 'pratica_renraku_waza', 'pratica_kaeshi_waza', 'pratica_katame_waza'];
  
  switch (grade) {
    case '1º DAN':
      return {
        teoria: [...baseTeoria, 'teoria_atualidades', 'teoria_kata'],
        pratica: ['pratica_nage_no_kata', ...basePratica, 'pratica_arbitragem'],
      };
    case '2º DAN':
      return {
        teoria: [...baseTeoria, 'teoria_atualidades', 'teoria_kata', 'teoria_arbitragem'],
        pratica: ['pratica_katame_no_kata', 'pratica_nage_no_kata', ...basePratica, 'pratica_pedagogia'],
      };
    case '3º DAN':
      return {
        teoria: [...baseTeoria, 'teoria_kata', 'teoria_arbitragem'],
        pratica: ['pratica_ju_no_kata', 'pratica_katame_no_kata', 'pratica_pedagogia'],
      };
    case '4º DAN':
      return {
        teoria: [...baseTeoria, 'teoria_kata', 'teoria_arbitragem'],
        pratica: ['pratica_kime_no_kata', 'pratica_ju_no_kata', 'pratica_pedagogia'],
      };
    case '5º DAN':
      return {
        teoria: [...baseTeoria, 'teoria_kata', 'teoria_arbitragem'],
        pratica: ['pratica_goshin_jutsu', 'pratica_kime_no_kata', 'pratica_pedagogia'],
      };
    default:
      return { teoria: baseTeoria, pratica: basePratica };
  }
};

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

// Mapeamento de campos práticos para categorias de técnicas
const practicalFieldCategories: Record<string, string[]> = {
  pratica_nage_no_kata: ['Te-waza', 'Koshi-waza', 'Ashi-waza', 'Ma-sutemi-waza', 'Yoko-sutemi-waza'],
  pratica_katame_no_kata: ['Osaekomi-waza', 'Shime-waza', 'Kansetsu-waza'],
  pratica_ju_no_kata: ['Te-waza', 'Koshi-waza', 'Ashi-waza'],
  pratica_kime_no_kata: ['Te-waza', 'Koshi-waza', 'Ashi-waza'],
  pratica_goshin_jutsu: ['Te-waza', 'Koshi-waza', 'Ashi-waza', 'Kansetsu-waza'],
  pratica_nage_waza: ['Ashi-waza', 'Te-waza', 'Koshi-waza', 'Ma-sutemi-waza', 'Yoko-sutemi-waza', 'Habukareta-waza (Técnicas Excluídas)', 'Shinmeisho-no-waza (Novas Técnicas)'],
  pratica_renraku_waza: ['Ashi-waza', 'Te-waza', 'Koshi-waza', 'Ma-sutemi-waza', 'Yoko-sutemi-waza', 'Habukareta-waza (Técnicas Excluídas)', 'Shinmeisho-no-waza (Novas Técnicas)'],
  pratica_kaeshi_waza: ['Ashi-waza', 'Te-waza', 'Koshi-waza', 'Ma-sutemi-waza', 'Yoko-sutemi-waza', 'Habukareta-waza (Técnicas Excluídas)', 'Shinmeisho-no-waza (Novas Técnicas)'],
  pratica_katame_waza: ['Osaekomi-waza', 'Shime-waza', 'Kansetsu-waza', 'Shinmeisho-no-waza (Novas Técnicas)'],
};

interface Candidate {
  id: string;
  full_name: string;
  target_grade: string;
}

export default function NewEvaluation() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveOffline } = useOfflineEvaluation();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('1º DAN');
  const [evaluatorName, setEvaluatorName] = useState('');
  const [evaluatorGrade, setEvaluatorGrade] = useState('');
  const [location, setLocation] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  const [fields, setFields] = useState<EvaluationFields>(initialFields);
  const [practicalTechniques, setPracticalTechniques] = useState<Record<string, GroupTechniqueScore[]>>({});
  const [loading, setLoading] = useState(false);
  const [savedEvaluationId, setSavedEvaluationId] = useState<string | null>(null);
  const [panelEnabled, setPanelEnabled] = useState(false);
  const [panelEvaluators, setPanelEvaluators] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCandidates() {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, full_name, target_grade')
        .order('full_name');
      
      if (data) {
        setCandidates(data);
        localStorage.setItem('shodanavalia_candidates_cache', JSON.stringify(data));
      } else if (error) {
        // Offline fallback
        try {
          const cached = JSON.parse(localStorage.getItem('shodanavalia_candidates_cache') || '[]');
          setCandidates(cached);
        } catch { /* ignore */ }
      }
    }
    fetchCandidates();
  }, []);

  const handleFieldChange = (field: keyof EvaluationFields, value: string) => {
    // Validar nota entre 0 e 10
    const numValue = parseFloat(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 10)) {
      return;
    }
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const calculateAverage = (fieldList: string[]): number => {
    const values = fieldList
      .map(f => parseFloat(fields[f as keyof EvaluationFields] || '0'))
      .filter(v => !isNaN(v) && v > 0);
    
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // Calcular média de técnicas por grupo prático
  const calculatePracticalGroupAverage = (field: string): number => {
    const techs = practicalTechniques[field] || [];
    const valid = techs.filter(s => s.score !== '' && !isNaN(parseFloat(s.score)));
    if (valid.length === 0) return parseFloat(fields[field as keyof EvaluationFields] || '0');
    return valid.reduce((sum, s) => sum + parseFloat(s.score), 0) / valid.length;
  };

  const gradeFields = getFieldsByGrade(selectedGrade);
  const notaTeorica = calculateAverage(gradeFields.teoria);
  
  // Média prática: usa média das técnicas de cada grupo quando disponível
  const notaPratica = (() => {
    const values = gradeFields.pratica
      .map(f => calculatePracticalGroupAverage(f))
      .filter(v => !isNaN(v) && v > 0);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  })();

  const notaFinal = (notaTeorica + notaPratica) / 2;

  const handleUpdatePracticalTechniques = (field: string, scores: GroupTechniqueScore[]) => {
    setPracticalTechniques(prev => ({ ...prev, [field]: scores }));
    // Auto-update the field score with the average
    const valid = scores.filter(s => s.score !== '' && !isNaN(parseFloat(s.score)));
    if (valid.length > 0) {
      const avg = valid.reduce((sum, s) => sum + parseFloat(s.score), 0) / valid.length;
      setFields(prev => ({ ...prev, [field]: avg.toFixed(2) }));
    }
  };

  const handleGeneratePDF = () => {
    const candidateName = candidates.find(c => c.id === selectedCandidate)?.full_name || 'Candidato';
    
    const teoriaScores = gradeFields.teoria.map(field => ({
      label: fieldLabels[field],
      score: fields[field as keyof EvaluationFields],
    }));
    
    const praticaScores = gradeFields.pratica.map(field => ({
      label: fieldLabels[field],
      score: fields[field as keyof EvaluationFields],
    }));

    generateEvaluationPDF({
      candidateName,
      targetGrade: selectedGrade,
      evaluatorName,
      evaluatorGrade,
      evaluationDate,
      location,
      observations,
      teoriaScores,
      praticaScores,
      notaTeorica,
      notaPratica,
      notaFinal,
      techniqueScores: Object.entries(practicalTechniques).flatMap(([field, techs]) =>
        techs.filter(t => t.score !== '').map(t => ({
          category: fieldLabels[field] || field,
          technique: t.technique,
          score: t.score,
        }))
      ),
    });

    toast({
      title: 'PDF Gerado!',
      description: 'O arquivo foi baixado automaticamente.',
    });
  };

  const handleSubmit = async (status: 'pendente' | 'aprovado' | 'reprovado') => {
    if (!selectedCandidate) {
      toast({ title: 'Erro', description: 'Selecione um candidato.', variant: 'destructive' });
      return;
    }
    if (!evaluatorName || !evaluatorGrade) {
      toast({ title: 'Erro', description: 'Preencha os dados do avaliador.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const evaluationData: Record<string, unknown> = {
      candidate_id: selectedCandidate,
      target_grade: selectedGrade,
      evaluator_name: evaluatorName,
      evaluator_grade: evaluatorGrade,
      location: location || null,
      evaluation_date: evaluationDate,
      observations: observations || null,
      nota_teorica_final: notaTeorica,
      nota_pratica_final: notaPratica,
      nota_final: notaFinal,
      status,
    };

    // Adicionar notas dos campos
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== '') {
        evaluationData[key] = parseFloat(value);
      }
    });

    // Verificar conexão — salvar offline se necessário
    if (!navigator.onLine) {
      const candidateName = candidates.find(c => c.id === selectedCandidate)?.full_name || 'Candidato';
      saveOffline({
        temp_id: crypto.randomUUID(),
        evaluation_data: evaluationData,
        candidate_name: candidateName,
        target_grade: selectedGrade,
        nota_final: notaFinal,
        status,
        created_at: new Date().toISOString(),
        sync_status: 'pending',
      });
      toast({
        title: 'Avaliação salva localmente',
        description: 'Será sincronizada automaticamente quando houver conexão.',
      });
      navigate('/');
      setLoading(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from('evaluations')
      .insert([evaluationData as any])
      .select('id')
      .single();

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else if (inserted) {
      setSavedEvaluationId(inserted.id);
      toast({
        title: 'Avaliação salva!',
        description: `Candidato ${status === 'aprovado' ? 'aprovado' : status === 'reprovado' ? 'reprovado' : 'avaliação pendente'}. Você pode anexar vídeos agora.`,
      });
    }

    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        {/* Cabeçalho da Súmula */}
        <Card className="overflow-hidden">
          <div className="sumula-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold">
                  Súmula de Avaliação
                </h1>
                <p className="text-sm opacity-80 mt-1">
                  Exame de Graduação - Regulamento CBJ
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleGeneratePDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            {/* Dados Gerais */}
            <div className="sumula-section">
              <h3 className="font-display font-semibold text-lg mb-4">Dados da Avaliação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Candidato</Label>
                  <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o candidato" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Graduação Pretendida</Label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.slice(0, 5).map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Data da Avaliação</Label>
                  <Input 
                    type="date" 
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Nome do Avaliador</Label>
                  <Input 
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                
                <div>
                  <Label>Graduação do Avaliador</Label>
                  <Select value={evaluatorGrade} onValueChange={setEvaluatorGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Local</Label>
                  <Input 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Local do exame"
                  />
                </div>
              </div>
            </div>

            {/* Prova Teórica */}
            <div className="sumula-section">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                Prova Teórica
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gradeFields.teoria.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">{fieldLabels[field]}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={fields[field as keyof EvaluationFields]}
                      onChange={(e) => handleFieldChange(field as keyof EvaluationFields, e.target.value)}
                      className="score-input w-full"
                      placeholder="0-10"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-secondary rounded-lg flex items-center justify-between">
                <span className="font-medium">Média Teórica:</span>
                <span className="text-xl font-bold">{notaTeorica.toFixed(2)}</span>
              </div>
            </div>

            {/* Prova Prática */}
            <div className="sumula-section">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                Prova Prática
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Expanda cada grupo para adicionar técnicas individuais com suas notas.
              </p>
              <div className="space-y-3">
                {gradeFields.pratica.map((field) => {
                  const categories = practicalFieldCategories[field];
                  if (categories) {
                    return (
                      <PracticalSectionScoring
                        key={field}
                        label={fieldLabels[field]}
                        techniqueCategories={categories}
                        scores={practicalTechniques[field] || []}
                        onChange={(scores) => handleUpdatePracticalTechniques(field, scores)}
                      />
                    );
                  }
                  // Campos sem técnicas (arbitragem, pedagogia) ficam como input simples
                  return (
                    <div key={field} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                      <Label className="text-sm font-semibold">{fieldLabels[field]}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={fields[field as keyof EvaluationFields]}
                        onChange={(e) => handleFieldChange(field as keyof EvaluationFields, e.target.value)}
                        className="w-24 text-center"
                        placeholder="0-10"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-secondary rounded-lg flex items-center justify-between">
                <span className="font-medium">Média Prática:</span>
                <span className="text-xl font-bold">{notaPratica.toFixed(2)}</span>
              </div>
            </div>

            {/* Resultado Final */}
            <div className="sumula-section">
              <h3 className="font-display font-semibold text-lg mb-4">Resultado</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-secondary rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Média Teórica</span>
                    <p className="text-xl font-bold">{notaTeorica.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Média Prática</span>
                    <p className="text-xl font-bold">{notaPratica.toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-4 bg-primary text-primary-foreground rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Nota Final:</span>
                    <span className="text-3xl font-bold">{notaFinal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="sumula-section border-b-0 pb-0 mb-0">
              <h3 className="font-display font-semibold text-lg mb-4">Observações</h3>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações sobre a avaliação..."
                rows={4}
              />
            </div>
          </CardContent>

          {/* Upload de Vídeos */}
          <div className="p-6 pt-0">
            {savedEvaluationId ? (
              <VideoUploadSection evaluationId={savedEvaluationId} />
            ) : (
              <Card className="bg-secondary/30">
                <CardContent className="p-6 text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Salve a avaliação primeiro para poder anexar vídeos de prova
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ações */}
          <div className="border-t p-6 bg-secondary/50 flex flex-col sm:flex-row gap-3 justify-end">
            {savedEvaluationId ? (
              <Button onClick={() => navigate('/evaluations')}>
                Ir para Avaliações
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={() => handleSubmit('pendente')}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleSubmit('reprovado')}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reprovar
                </Button>
                <Button 
                  className="bg-success hover:bg-success/90"
                  onClick={() => handleSubmit('aprovado')}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
