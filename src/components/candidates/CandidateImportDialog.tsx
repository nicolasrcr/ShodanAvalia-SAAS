import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { translateError } from '@/utils/translateError';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from '@e965/xlsx';

interface ParsedCandidate {
  full_name: string;
  email?: string | null;
  birth_date?: string | null;
  federation: string;
  association?: string | null;
  current_grade: string;
  target_grade: string;
  zempo_registration?: string | null;
  registration_years: number;
  accumulated_points: number;
}

interface CandidateImportDialogProps {
  onImportComplete: () => void;
}

export function CandidateImportDialog({ onImportComplete }: CandidateImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [loading, setLoading] = useState(false);
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const [fileName, setFileName] = useState('');

  const resetState = () => {
    setStep('upload');
    setLoading(false);
    setParsedCandidates([]);
    setFileName('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setLoading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        await parseSpreadsheet(file);
      } else if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'txt') {
        await parseWithAI(file);
      } else {
        toast({
          title: 'Formato não suportado',
          description: 'Use arquivos Excel (.xlsx, .xls), CSV, PDF, DOC ou TXT.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setStep('preview');
    } catch (error: any) {
      toast({
        title: 'Erro ao processar arquivo',
        description: translateError(error.message) || 'Não foi possível ler o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const parseSpreadsheet = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    if (rows.length === 0) {
      throw new Error('Planilha vazia.');
    }

    const candidates: ParsedCandidate[] = rows.map((row) => {
      const findCol = (keywords: string[]) => {
        const key = Object.keys(row).find((k) =>
          keywords.some((kw) => k.toLowerCase().includes(kw))
        );
        return key ? String(row[key]).trim() : '';
      };

      let birthDate = findCol(['nascimento', 'birth', 'data_nascimento', 'data nasc']);
      if (birthDate && !birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try DD/MM/YYYY
        const parts = birthDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (parts) {
          birthDate = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        } else {
          birthDate = '';
        }
      }

      return {
        full_name: findCol(['nome', 'name', 'candidato', 'full_name']) || 'Sem nome',
        email: findCol(['email', 'e-mail']) || null,
        birth_date: birthDate || null,
        federation: findCol(['federação', 'federacao', 'federation']) || 'Não informada',
        association: findCol(['associação', 'associacao', 'association', 'clube']) || null,
        current_grade: findCol(['grau atual', 'graduação atual', 'current_grade', 'faixa atual']) || '1º KYÛ',
        target_grade: findCol(['grau pretendido', 'graduação pretendida', 'target_grade']) || '1º DAN',
        zempo_registration: findCol(['zempo', 'registro', 'registration']) || null,
        registration_years: parseInt(findCol(['anos', 'years', 'tempo'])) || 0,
        accumulated_points: parseInt(findCol(['pontos', 'points'])) || 0,
      };
    });

    setParsedCandidates(candidates.filter((c) => c.full_name && c.full_name !== 'Sem nome'));
  };

  const parseWithAI = async (file: File) => {
    // Read file as text
    let text = '';
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt') {
      text = await file.text();
    } else {
      // For PDF/DOC, read as base64 and let the edge function handle it
      // We'll try reading as text first for simple files
      try {
        text = await file.text();
        // If it looks like binary, we'll send what we can
        if (text.includes('\x00') || text.length < 10) {
          throw new Error('Binary file');
        }
      } catch {
        // For binary files, convert to base64 and extract what text we can
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Try to extract readable text from the binary
        const decoder = new TextDecoder('utf-8', { fatal: false });
        text = decoder.decode(bytes);
        // Clean non-printable characters
        text = text.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, ' ').replace(/\s{3,}/g, '\n');
      }
    }

    if (!text.trim()) {
      throw new Error('Não foi possível extrair texto do documento. Tente usar um arquivo Excel ou CSV.');
    }

    const { data, error } = await supabase.functions.invoke('parse-candidates', {
      body: { text, fileName: file.name },
    });

    if (error) throw error;

    if (data?.candidates && data.candidates.length > 0) {
      setParsedCandidates(data.candidates);
    } else {
      throw new Error('Nenhum candidato encontrado no documento.');
    }
  };

  const handleImport = async () => {
    if (parsedCandidates.length === 0) return;

    setStep('importing');
    setLoading(true);

    try {
      const toInsert = parsedCandidates.map((c) => ({
        full_name: c.full_name,
        email: c.email || null,
        birth_date: c.birth_date || '2000-01-01',
        federation: c.federation || 'Não informada',
        association: c.association || null,
        current_grade: c.current_grade || '1º KYÛ',
        target_grade: c.target_grade || '1º DAN',
        zempo_registration: c.zempo_registration || null,
        registration_years: c.registration_years || 0,
        accumulated_points: c.accumulated_points || 0,
      }));

      const { error } = await supabase.from('candidates').insert(toInsert);

      if (error) throw error;

      toast({
        title: 'Importação concluída!',
        description: `${toInsert.length} candidato(s) importado(s) com sucesso.`,
      });

      onImportComplete();
      setOpen(false);
      resetState();
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: translateError(error.message),
        variant: 'destructive',
      });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const removeCandidate = (index: number) => {
    setParsedCandidates((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Importar Candidatos</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de uma lista de candidatos em Excel, CSV, PDF ou DOC.
              O sistema irá extrair automaticamente as informações.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border-dashed cursor-pointer hover:border-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
                  <FileSpreadsheet className="h-8 w-8 text-accent" />
                  <span className="font-medium text-sm">Excel / CSV</span>
                  <span className="text-xs text-muted-foreground">.xlsx, .xls, .csv</span>
                </CardContent>
              </Card>

              <Card className="border-dashed cursor-pointer hover:border-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
                  <FileText className="h-8 w-8 text-accent" />
                  <span className="font-medium text-sm">Documento</span>
                  <span className="text-xs text-muted-foreground">.pdf, .doc, .docx, .txt</span>
                </CardContent>
              </Card>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
            />

            {loading && (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">Processando arquivo...</span>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>
                <strong>{parsedCandidates.length}</strong> candidato(s) encontrado(s) em <strong>{fileName}</strong>
              </span>
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Nome</th>
                    <th className="text-left p-2 font-medium">Federação</th>
                    <th className="text-left p-2 font-medium">Grau Atual</th>
                    <th className="text-left p-2 font-medium">Pretendido</th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedCandidates.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{c.full_name}</td>
                      <td className="p-2 text-muted-foreground">{c.federation}</td>
                      <td className="p-2">{c.current_grade}</td>
                      <td className="p-2">{c.target_grade}</td>
                      <td className="p-2">
                        <button
                          onClick={() => removeCandidate(i)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedCandidates.some((c) => !c.birth_date) && (
              <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Alguns candidatos não possuem data de nascimento. Será utilizada uma data padrão (01/01/2000).
                  Você pode editar depois.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetState}>Voltar</Button>
              <Button
                className="bg-accent hover:bg-accent/90"
                onClick={handleImport}
                disabled={parsedCandidates.length === 0}
              >
                Importar {parsedCandidates.length} candidato(s)
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span className="text-sm text-muted-foreground">Importando candidatos...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
