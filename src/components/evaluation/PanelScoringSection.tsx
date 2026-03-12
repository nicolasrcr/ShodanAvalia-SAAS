import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { GRADE_OPTIONS } from '@/types/evaluation';

interface PanelEvaluator {
  evaluator_number: number;
  evaluator_name: string;
  evaluator_grade: string;
  scores: Record<string, string>;
  nota_teorica_final: number;
  nota_pratica_final: number;
  nota_final: number;
}

interface PanelScoringSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  evaluators: PanelEvaluator[];
  onEvaluatorsChange: (evaluators: PanelEvaluator[]) => void;
  activeFields: { teoria: string[]; pratica: string[] };
  fieldLabels: Record<string, string>;
}

const createEmptyEvaluator = (num: number): PanelEvaluator => ({
  evaluator_number: num,
  evaluator_name: '',
  evaluator_grade: '',
  scores: {},
  nota_teorica_final: 0,
  nota_pratica_final: 0,
  nota_final: 0,
});

export function PanelScoringSection({
  enabled,
  onEnabledChange,
  evaluators,
  onEvaluatorsChange,
  activeFields,
  fieldLabels,
}: PanelScoringSectionProps) {
  const [expandedEvaluator, setExpandedEvaluator] = useState<number | null>(1);

  const handleAddEvaluator = () => {
    if (evaluators.length >= 3) return;
    const next = evaluators.length + 1;
    onEvaluatorsChange([...evaluators, createEmptyEvaluator(next)]);
  };

  const handleRemoveEvaluator = (num: number) => {
    if (evaluators.length <= 2) return;
    const updated = evaluators
      .filter(e => e.evaluator_number !== num)
      .map((e, i) => ({ ...e, evaluator_number: i + 1 }));
    onEvaluatorsChange(updated);
  };

  const handleNameChange = (num: number, name: string) => {
    onEvaluatorsChange(
      evaluators.map(e => e.evaluator_number === num ? { ...e, evaluator_name: name } : e)
    );
  };

  const handleGradeChange = (num: number, grade: string) => {
    onEvaluatorsChange(
      evaluators.map(e => e.evaluator_number === num ? { ...e, evaluator_grade: grade } : e)
    );
  };

  const handleScoreChange = (num: number, field: string, value: string) => {
    const numValue = parseFloat(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 10)) return;

    onEvaluatorsChange(
      evaluators.map(e => {
        if (e.evaluator_number !== num) return e;
        const newScores = { ...e.scores, [field]: value };
        // Recalculate averages
        const teoriaValues = activeFields.teoria
          .map(f => parseFloat(newScores[f] || '0'))
          .filter(v => !isNaN(v) && v > 0);
        const praticaValues = activeFields.pratica
          .map(f => parseFloat(newScores[f] || '0'))
          .filter(v => !isNaN(v) && v > 0);
        const nt = teoriaValues.length > 0 ? teoriaValues.reduce((a, b) => a + b, 0) / teoriaValues.length : 0;
        const np = praticaValues.length > 0 ? praticaValues.reduce((a, b) => a + b, 0) / praticaValues.length : 0;
        return {
          ...e,
          scores: newScores,
          nota_teorica_final: nt,
          nota_pratica_final: np,
          nota_final: (nt + np) / 2,
        };
      })
    );
  };

  // Calculate panel average
  const panelAverage = evaluators.length > 0
    ? evaluators.reduce((sum, e) => sum + e.nota_final, 0) / evaluators.length
    : 0;

  const handleToggle = (val: boolean) => {
    onEnabledChange(val);
    if (val && evaluators.length === 0) {
      onEvaluatorsChange([createEmptyEvaluator(1), createEmptyEvaluator(2), createEmptyEvaluator(3)]);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Banca Examinadora (Multi-Avaliador)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="panel-toggle" className="text-sm text-muted-foreground">
              {enabled ? 'Ativo' : 'Desativado'}
            </Label>
            <Switch id="panel-toggle" checked={enabled} onCheckedChange={handleToggle} />
          </div>
        </div>
        {enabled && (
          <p className="text-sm text-muted-foreground">
            Cada avaliador da banca registra suas notas individualmente. A nota final é a média aritmética.
          </p>
        )}
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* Panel Average */}
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <span className="font-medium text-sm">Média da Banca ({evaluators.length} avaliadores):</span>
            <span className="text-xl font-bold text-primary">{panelAverage.toFixed(2)}</span>
          </div>

          {evaluators.map((evaluator) => (
            <Card key={evaluator.evaluator_number} className="bg-secondary/30">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedEvaluator(
                  expandedEvaluator === evaluator.evaluator_number ? null : evaluator.evaluator_number
                )}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Avaliador {evaluator.evaluator_number}
                  </Badge>
                  <span className="text-sm font-medium">
                    {evaluator.evaluator_name || 'Sem nome'}
                  </span>
                  {evaluator.nota_final > 0 && (
                    <Badge variant="secondary">{evaluator.nota_final.toFixed(2)}</Badge>
                  )}
                </div>
                {expandedEvaluator === evaluator.evaluator_number
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>

              {expandedEvaluator === evaluator.evaluator_number && (
                <CardContent className="pt-0 space-y-4">
                  {/* Evaluator Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={evaluator.evaluator_name}
                        onChange={(e) => handleNameChange(evaluator.evaluator_number, e.target.value)}
                        placeholder="Nome do avaliador"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Graduação</Label>
                      <Select
                        value={evaluator.evaluator_grade}
                        onValueChange={(v) => handleGradeChange(evaluator.evaluator_number, v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {GRADE_OPTIONS.map(g => (
                            <SelectItem key={g.value} value={g.value}>{g.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Teoria */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEÓRICA</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {activeFields.teoria.map(field => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs truncate block">{fieldLabels[field]}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={evaluator.scores[field] || ''}
                            onChange={(e) => handleScoreChange(evaluator.evaluator_number, field, e.target.value)}
                            className="h-8 text-center text-sm"
                            placeholder="0-10"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-right text-sm">
                      <span className="text-muted-foreground">Média: </span>
                      <span className="font-bold">{evaluator.nota_teorica_final.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Prática */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">PRÁTICA</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeFields.pratica.map(field => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs truncate block">{fieldLabels[field]}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={evaluator.scores[field] || ''}
                            onChange={(e) => handleScoreChange(evaluator.evaluator_number, field, e.target.value)}
                            className="h-8 text-center text-sm"
                            placeholder="0-10"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-right text-sm">
                      <span className="text-muted-foreground">Média: </span>
                      <span className="font-bold">{evaluator.nota_pratica_final.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Individual Final */}
                  <div className="p-2 bg-secondary rounded flex items-center justify-between">
                    <span className="text-sm font-medium">Nota Final deste Avaliador:</span>
                    <span className="text-lg font-bold">{evaluator.nota_final.toFixed(2)}</span>
                  </div>

                  {evaluators.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleRemoveEvaluator(evaluator.evaluator_number)}
                    >
                      Remover Avaliador
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          ))}

          {evaluators.length < 3 && (
            <Button variant="outline" size="sm" onClick={handleAddEvaluator} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Avaliador ({evaluators.length}/3)
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
