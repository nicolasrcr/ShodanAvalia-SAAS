import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { translateError } from '@/utils/translateError';
import { useToast } from '@/hooks/use-toast';
import { GRADE_OPTIONS, PREVIOUS_GRADES, type Candidate } from '@/types/evaluation';
import { Plus, Search, Edit, Trash2, FileDown } from 'lucide-react';
import { generateCandidatesReportPDF } from '@/utils/generateReportsPDF';
import { CandidateImportDialog } from '@/components/candidates/CandidateImportDialog';

export default function CandidatesPage() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    birth_date: '',
    federation: '',
    association: '',
    current_grade: '1º KYÛ',
    target_grade: '1º DAN',
    zempo_registration: '',
    registration_years: 0,
    accumulated_points: 0,
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('full_name');
    
    if (error) {
      toast({
        title: 'Erro ao carregar candidatos',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCandidates(data || []);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.birth_date || !formData.federation) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (editingId) {
      // Update existing candidate
      const { error } = await supabase.from('candidates').update({
        ...formData,
        email: formData.email || null,
        association: formData.association || null,
        zempo_registration: formData.zempo_registration || null,
      }).eq('id', editingId);

      if (error) {
        toast({
          title: 'Erro ao atualizar',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Candidato atualizado!',
          description: 'Os dados foram atualizados com sucesso.',
        });
        setIsDialogOpen(false);
        setEditingId(null);
        resetForm();
        fetchCandidates();
      }
    } else {
      // Create new candidate
      const { error } = await supabase.from('candidates').insert({
        ...formData,
        email: formData.email || null,
        association: formData.association || null,
        zempo_registration: formData.zempo_registration || null,
      });

      if (error) {
        toast({
          title: 'Erro ao cadastrar',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Candidato cadastrado!',
          description: 'O candidato foi adicionado com sucesso.',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchCandidates();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      birth_date: '',
      federation: '',
      association: '',
      current_grade: '1º KYÛ',
      target_grade: '1º DAN',
      zempo_registration: '',
      registration_years: 0,
      accumulated_points: 0,
    });
  };

  const openEditDialog = (candidate: Candidate) => {
    setFormData({
      full_name: candidate.full_name,
      email: candidate.email || '',
      birth_date: candidate.birth_date,
      federation: candidate.federation,
      association: candidate.association || '',
      current_grade: candidate.current_grade,
      target_grade: candidate.target_grade,
      zempo_registration: candidate.zempo_registration || '',
      registration_years: candidate.registration_years || 0,
      accumulated_points: candidate.accumulated_points || 0,
    });
    setEditingId(candidate.id);
    setIsDialogOpen(true);
  };

  const filteredCandidates = candidates.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.federation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Candidato excluído', description: `${name} foi removido com sucesso.` });
      fetchCandidates();
    }
  };

  const handleExportPDF = () => {
    generateCandidatesReportPDF(filteredCandidates);
    toast({ title: 'PDF Gerado!', description: 'Relatório de candidatos exportado com sucesso.' });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Candidatos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar candidatos para avaliação de graduação
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={filteredCandidates.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            
            <CandidateImportDialog onImportComplete={fetchCandidates} />
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingId(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Candidato
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingId ? 'Editar Candidato' : 'Cadastrar Candidato'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Data de Nascimento *</Label>
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Federação *</Label>
                    <Input
                      value={formData.federation}
                      onChange={(e) => setFormData(prev => ({ ...prev, federation: e.target.value }))}
                      placeholder="Ex: FPJUDO"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Associação</Label>
                    <Input
                      value={formData.association}
                      onChange={(e) => setFormData(prev => ({ ...prev, association: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Graduação Atual</Label>
                    <Select 
                      value={formData.current_grade} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, current_grade: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PREVIOUS_GRADES.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Graduação Pretendida</Label>
                    <Select 
                      value={formData.target_grade} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, target_grade: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.slice(0, 5).map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Registro Zempo</Label>
                    <Input
                      value={formData.zempo_registration}
                      onChange={(e) => setFormData(prev => ({ ...prev, zempo_registration: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Anos de Registro</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.registration_years}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_years: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Pontos Acumulados</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.accumulated_points}
                      onChange={(e) => setFormData(prev => ({ ...prev, accumulated_points: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-accent hover:bg-accent/90">
                    Cadastrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou federação..."
            className="pl-10"
          />
        </div>

        {/* Candidates List */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Carregando candidatos...
              </CardContent>
            </Card>
          ) : filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {searchTerm ? 'Nenhum candidato encontrado.' : 'Nenhum candidato cadastrado.'}
              </CardContent>
            </Card>
          ) : (
            filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {candidate.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{candidate.full_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                            {candidate.current_grade}
                          </span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded">
                            {candidate.target_grade}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="hidden md:block">
                        <span className="font-medium">{candidate.federation}</span>
                        {candidate.association && <span> • {candidate.association}</span>}
                      </div>
                      <div className="hidden lg:block">
                        <span>{candidate.accumulated_points} pts</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(candidate)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir candidato?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir <strong>{candidate.full_name}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(candidate.id, candidate.full_name)} className="bg-destructive hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
