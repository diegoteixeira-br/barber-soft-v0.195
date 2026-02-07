import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scissors, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";

interface BarberInfo {
  id: string;
  name: string;
  email: string | null;
  unit_name: string;
  company_name: string;
}

export default function BarberInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isReady: isRecaptchaReady, executeRecaptcha } = useRecaptcha();

  const [isValidating, setIsValidating] = useState(true);
  const [barberInfo, setBarberInfo] = useState<BarberInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Token de convite inválido");
        setIsValidating(false);
        return;
      }

      try {
        const { data: response, error: invokeError } = await supabase.functions.invoke(
          "validate-barber-invite",
          {
            body: { token },
          }
        );

        if (invokeError) throw invokeError;

        if (!response?.valid) {
          setError(response?.error || "Convite não encontrado ou expirado");
          setIsValidating(false);
          return;
        }

        const barber = response.barber;

        setBarberInfo({
          id: barber.id,
          name: barber.name,
          email: barber.email,
          unit_name: barber.unit_name,
          company_name: barber.company_name,
        });

        if (barber.email) {
          setEmail(barber.email);
        }
      } catch (err) {
        console.error("Error validating token:", err);
        setError("Erro ao validar convite");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const verifyRecaptcha = async (action: string): Promise<boolean> => {
    // Skip reCAPTCHA verification if not ready
    if (!isRecaptchaReady) {
      console.warn("reCAPTCHA not ready, skipping verification");
      return true;
    }

    const recaptchaToken = await executeRecaptcha(action);
    if (!recaptchaToken) {
      console.warn("Could not generate reCAPTCHA token, allowing fallback");
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke("verify-recaptcha", {
        body: { token: recaptchaToken, action },
      });

      if (error || !data?.success) {
        console.warn("reCAPTCHA verification failed, allowing fallback:", error || data);
        return true;
      }

      return true;
    } catch (err) {
      console.error("reCAPTCHA verification error:", err);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barberInfo) return;

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A senha e a confirmação devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify reCAPTCHA first
      const action = isLogin ? "barber_invite_login" : "barber_invite_signup";
      const isHuman = await verifyRecaptcha(action);
      if (!isHuman) {
        setIsSubmitting(false);
        return;
      }

      if (isLogin) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        const { error: linkError } = await supabase.functions.invoke("link-barber-account", {
          body: {
            barberId: barberInfo.id,
            userId: authData.user.id,
            inviteToken: token,
          },
        });

        if (linkError) throw linkError;

        toast({
          title: "Conta vinculada com sucesso!",
          description: "Você será redirecionado...",
        });

        navigate("/barber");
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/barber`,
            data: {
              name: barberInfo.name,
              role: "barber",
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: linkError } = await supabase.functions.invoke("link-barber-account", {
            body: {
              barberId: barberInfo.id,
              userId: authData.user.id,
              inviteToken: token,
            },
          });

          if (linkError) {
            console.error("Link error:", linkError);
          }
        }

        toast({
          title: "Conta criada com sucesso!",
          description: "Você será redirecionado para o painel...",
        });

        navigate("/barber");
      }
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Erro",
        description: err.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth/barber")}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Olá, {barberInfo?.name}!</CardTitle>
          <CardDescription>
            Você foi convidado para fazer parte da equipe{" "}
            <span className="font-semibold text-foreground">{barberInfo?.company_name}</span>
            {barberInfo?.unit_name && (
              <>
                {" "}na unidade <span className="font-semibold text-foreground">{barberInfo.unit_name}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={!!barberInfo?.email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Sua senha" : "Crie uma senha"}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !isRecaptchaReady}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Entrar e Vincular Conta
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar Conta
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary hover:underline"
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary hover:underline"
                  >
                    Fazer login
                  </button>
                </>
              )}
            </div>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Este site é protegido pelo reCAPTCHA e a{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Política de Privacidade
            </a>{" "}
            e{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Termos de Serviço
            </a>{" "}
            do Google se aplicam.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
