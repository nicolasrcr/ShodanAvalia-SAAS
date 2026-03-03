import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Video, Upload, Play, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const VIDEO_TYPES = [
  'Prova Prática Completa',
  'Nage no Kata',
  'Katame no Kata',
  'Ju no Kata',
  'Kime no Kata',
  'Kodokan Goshin Jutsu',
  'Arbitragem Prática',
  'Pedagogia',
  'Outro',
];

const ACCEPTED_MIME = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

interface EvaluationVideo {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  video_type: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
}

interface VideoUploadSectionProps {
  evaluationId: string;
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function VideoUploadSection({ evaluationId, readOnly = false }: VideoUploadSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<EvaluationVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoType, setVideoType] = useState('Prova Prática Completa');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    const { data } = await supabase
      .from('evaluation_videos')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .order('created_at', { ascending: false });
    setVideos((data as EvaluationVideo[]) || []);
    setLoadingVideos(false);
  }, [evaluationId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME.includes(file.type)) return 'Tipo de arquivo não aceito. Use MP4, MOV, WebM ou AVI.';
    if (file.size > MAX_SIZE) return 'Arquivo excede o limite de 500MB.';
    return null;
  };

  const handleFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) {
      toast({ title: 'Arquivo inválido', description: err, variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    setUploadProgress(10);

    const filePath = `evaluations/${evaluationId}/${crypto.randomUUID()}-${selectedFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from('evaluation-videos')
      .upload(filePath, selectedFile);

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    setUploadProgress(70);

    const { error: insertError } = await supabase.from('evaluation_videos').insert([{
      evaluation_id: evaluationId,
      uploaded_by: user.id,
      file_path: filePath,
      file_name: selectedFile.name,
      file_size: selectedFile.size,
      mime_type: selectedFile.type,
      video_type: videoType,
      description: description || null,
    }]);

    if (insertError) {
      toast({ title: 'Erro ao registrar vídeo', description: insertError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Vídeo enviado com sucesso' });
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchVideos();
    }

    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  };

  const handleWatch = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('evaluation-videos')
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const video = videos.find(v => v.id === deleteId);
    if (!video) return;

    await supabase.storage.from('evaluation-videos').remove([video.file_path]);
    await supabase.from('evaluation_videos').delete().eq('id', deleteId);
    setDeleteId(null);
    toast({ title: 'Vídeo excluído' });
    fetchVideos();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Vídeos de Prova (Auditoria)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload area */}
          {!readOnly && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {selectedFile ? (
                  <p className="text-sm font-medium">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Arraste um vídeo aqui ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM ou AVI — Máximo 500MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Select value={videoType} onValueChange={setVideoType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="Descrição do vídeo (opcional)"
                  rows={1}
                  className="resize-none"
                />
              </div>

              {uploading && <Progress value={uploadProgress} className="h-2" />}

              <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Enviar Vídeo'}
              </Button>
            </div>
          )}

          {/* Video list */}
          {loadingVideos ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando vídeos...</p>
          ) : videos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum vídeo anexado a esta avaliação</p>
          ) : (
            <div className="space-y-2">
              {videos.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-secondary/30">
                  <Video className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.file_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{v.video_type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatFileSize(v.file_size)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(v.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleWatch(v.file_path)}>
                      <Play className="h-4 w-4" />
                    </Button>
                    {(v.uploaded_by === user?.id || isAdmin) && !readOnly && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(v.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!navigator.onLine && !readOnly && (
            <div className="flex items-center gap-2 text-sm text-warning p-3 bg-warning/10 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              Upload de vídeo requer conexão com a internet
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vídeo?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
