import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Erro de validação', description: err.errors[0].message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível enviar o email. Tente novamente.', variant: 'destructive' });
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-1.5 bg-accent" />
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <span className="text-3xl font-display text-primary">柔道</span>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary font-display tracking-wide">ShodanAvalia</span>
            <span className="text-xs text-muted-foreground">Preparação para Faixa Preta</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 text-4xl font-display text-primary">講道館</div>
            <CardTitle className="font-display text-2xl text-primary">Recuperar Senha</CardTitle>
            <CardDescription>
              {sent
                ? 'Verifique seu email para o link de recuperação.'
                : 'Informe seu email para receber o link de recuperação.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Enviamos um email para <strong>{email}</strong> com instruções para redefinir sua senha.
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input id="forgot-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
                <Button variant="ghost" className="w-full" type="button" onClick={() => navigate('/auth')}>
                  Voltar ao login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
