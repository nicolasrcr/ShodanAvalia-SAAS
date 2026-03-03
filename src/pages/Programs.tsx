import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, CheckCircle, Clock, Target } from 'lucide-react';
import type { GradeProgram } from '@/types/evaluation';

export default function ProgramsPage() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<GradeProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  async function fetchPrograms() {
    const { data, error } = await supabase
      .from('grade_programs')
      .select('*')
      .order('minimum_age');
    
    if (error) {
      toast({
        title: 'Erro ao carregar programas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Parse JSONB fields
      const parsed = (data || []).map(p => ({
        ...p,
        required_katas: typeof p.required_katas === 'string' 
          ? JSON.parse(p.required_katas) 
          : p.required_katas || [],
        theoretical_topics: typeof p.theoretical_topics === 'string' 
          ? JSON.parse(p.theoretical_topics) 
          : p.theoretical_topics || [],
        practical_requirements: typeof p.practical_requirements === 'string' 
          ? JSON.parse(p.practical_requirements) 
          : p.practical_requirements || [],
      }));
      setPrograms(parsed as GradeProgram[]);
    }
    setLoading(false);
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Programas de Faixa
          </h1>
          <p className="text-muted-foreground mt-1">
            Requisitos oficiais do Regulamento CBJ 2018 para cada graduação
          </p>
        </div>

        {/* Programs */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Carregando programas...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {programs.map((program) => (
              <Card key={program.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary to-gray-800 text-primary-foreground">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="font-display text-2xl">
                      {program.grade}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Idade mín: {program.minimum_age} anos
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {program.minimum_points} pts
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-primary-foreground/80 mt-2">
                    Carência mínima: {program.minimum_carency_years} anos na graduação anterior
                  </p>
                </CardHeader>
                
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {/* Katas Obrigatórios */}
                    <AccordionItem value="katas" className="border-b">
                      <AccordionTrigger className="px-6 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-accent" />
                          <span>Katas Obrigatórios</span>
                          <Badge variant="outline" className="ml-2">
                            {program.required_katas?.length || 0}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <ul className="space-y-2">
                          {program.required_katas?.map((kata, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{kata}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Prova Teórica */}
                    <AccordionItem value="teoria" className="border-b">
                      <AccordionTrigger className="px-6 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-warning" />
                          <span>Prova Teórica</span>
                          <Badge variant="outline" className="ml-2">
                            {program.theoretical_topics?.length || 0} tópicos
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <ul className="space-y-2">
                          {program.theoretical_topics?.map((topic, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Prova Prática */}
                    <AccordionItem value="pratica">
                      <AccordionTrigger className="px-6 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-success" />
                          <span>Prova Prática</span>
                          <Badge variant="outline" className="ml-2">
                            {program.practical_requirements?.length || 0} requisitos
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <ul className="space-y-2">
                          {program.practical_requirements?.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Extra Gokyō */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/80 to-accent/60 text-white">
            <CardTitle className="font-display text-2xl">Extra Gokyō</CardTitle>
            <p className="text-sm text-white/80 mt-1">
              Técnicas além do Gokyō tradicional, reconhecidas pelo Kodokan
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="habukareta" className="border-b">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span>Habukareta-waza (Técnicas Excluídas)</span>
                    <Badge variant="outline" className="ml-2">8 técnicas</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    8 técnicas excluídas do Gokyō na revisão de 1920. Originalmente pertenciam a diferentes grupos:
                  </p>
                  <ul className="space-y-2">
                    {['Obi-otoshi (Te-waza)', 'Seoi-otoshi (Te-waza)', 'Yama-arashi (Te-waza)', 'Uchi-makikomi (Te-waza)',
                      'O-soto-otoshi (Ashi-waza)', 'Hikikomi-gaeshi (Ma-sutemi-waza)',
                      'Daki-wakare (Yoko-sutemi-waza)', 'Tawara-gaeshi (Ma-sutemi-waza)'].map((tech, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{tech}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shinmeisho">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-success" />
                    <span>Shinmeisho-no-waza (Novas Técnicas)</span>
                    <Badge variant="outline" className="ml-2">45 técnicas</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Técnicas reconhecidas pelo Kodokan a partir de 1982, divididas em Nage-waza (27) e Katame-waza (18).
                    Incluem variações de projeções (makikomi, gaeshi), imobilizações, estrangulamentos e chaves articulares
                    que complementam o Gokyō tradicional.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Nage-waza (27)</h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {['Morote-gari', 'Kuchiki-taoshi', 'Kibisu-gaeshi', 'Uchi-mata-sukashi',
                          'Ko-uchi-gaeshi', 'Obi-tori-gaeshi', 'Sode-tsurikomi-goshi', 'Ippon-seoi-nage',
                          'Ko-soto-gake', 'Uchi-mata-gaeshi', 'Harai-goshi-gaeshi', 'Hane-goshi-gaeshi',
                          'O-soto-gaeshi', 'O-uchi-gaeshi', 'Tsubame-gaeshi', 'Kani-basami',
                          'O-soto-makikomi', 'Kawazu-gake', 'Harai-makikomi', 'Uchi-mata-makikomi',
                          'Soto-makikomi', 'Ko-uchi-makikomi', 'Hane-makikomi', 'Sukui-nage',
                          'Yoko-gake', 'Yoko-guruma', 'Daki-age'].map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Katame-waza (18)</h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {['Uki-gatame', 'Ura-gatame', 'Ushiro-kesa-gatame', 'Kuzure-kesa-gatame',
                          'Kuzure-kami-shiho-gatame', 'Do-jime', 'Kata-juji-jime', 'Kataha-jime',
                          'Katate-jime', 'Ryote-jime', 'Tsukkomi-jime', 'Sankaku-jime',
                          'Ude-hishigi-ashi-gatame', 'Ude-hishigi-hara-gatame', 'Ude-hishigi-hiza-gatame',
                          'Ude-hishigi-sankaku-gatame', 'Ude-hishigi-te-gatame', 'Ude-hishigi-waki-gatame'].map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-secondary/50">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              <strong>Fonte:</strong> Regulamento para Exame e Outorga de Faixas e Graus - 
              Confederação Brasileira de Judô (CBJ), 2018. Os requisitos apresentados são 
              cumulativos e seguem as diretrizes do Conselho Nacional de Graus.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
