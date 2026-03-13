import { useState } from 'react';
import { translateError } from '@/utils/translateError';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido').max(255, 'Email muito longo');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo');

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Erro de validação', description: err.errors[0].message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    }
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: translateError(error.message),
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Erro de validação', description: err.errors[0].message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    }
    if (signupPassword !== signupConfirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    if (error) {
      const message = translateError(error.message);
      toast({ title: 'Erro ao cadastrar', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Cadastro realizado!', description: 'Verifique seu email para confirmar a conta.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top red bar */}
      <div className="w-full h-1.5 bg-accent" />

      {/* Header */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-display text-primary">柔道</span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary font-display tracking-wide">ShodanAvalia</span>
              <span className="text-xs text-muted-foreground">Preparação para Faixa Preta</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1">PT</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Hero text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              <span>🥋</span>
              <span>Plataforma de Avaliação</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
              <span className="text-foreground">Avaliação de</span>
              <br />
              <span className="text-accent">Graduação Dan</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
              Ferramenta completa para avaliadores conduzirem exames de graduação 
              do 1º ao 5º Dan. Súmulas digitais, cálculo automático de notas e relatórios oficiais.
            </p>

            <p className="text-sm text-muted-foreground">
              Conforme o Regulamento de Exame e Outorga de Faixas da CBJ
            </p>
          </div>

          {/* Right - Auth card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/5">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 text-4xl font-display text-primary">講道館</div>
                <CardTitle className="font-display text-2xl text-primary">ShodanAvalia</CardTitle>
                <CardDescription>Área do Avaliador</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" type="email" placeholder="seu@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                      </div>
                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Entrar'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nome Completo</Label>
                        <Input id="signup-name" type="text" placeholder="Seu nome" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="seu@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                        <Input id="signup-confirm" type="password" placeholder="••••••••" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required />
                      </div>
                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                        {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Bottom accent with kanji */}
      <div className="w-full border-t border-border py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">© ShodanAvalia - Sistema de Avaliação de Graduação de Judô</span>
          <div className="text-right">
            <span className="text-2xl font-display text-primary/60">初段</span>
            <p className="text-xs text-muted-foreground">Primeiro Dan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
