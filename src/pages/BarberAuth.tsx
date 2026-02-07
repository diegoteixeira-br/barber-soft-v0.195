import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { Scissors, Mail, Lock, Loader2 } from "lucide-react";

export default function BarberAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isReady: isRecaptchaReady, executeRecaptcha } = useRecaptcha();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "barber")
          .single();

        if (roleData) {
          navigate("/barbeiro");
          return;
        }
      }
      
      setIsCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  const verifyRecaptcha = async (): Promise<boolean> => {
    // Skip reCAPTCHA verification if not ready
    if (!isRecaptchaReady) {
      console.warn("reCAPTCHA not ready, skipping verification");
      return true;
    }

    const token = await executeRecaptcha("barber_login");
    if (!token) {
      console.warn("Could not generate reCAPTCHA token, allowing fallback");
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke("verify-recaptcha", {
        body: { token, action: "barber_login" },
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verify reCAPTCHA first
      const isHuman = await verifyRecaptcha();
      if (!isHuman) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Credenciais inválidas",
            description: "Verifique seu email e senha",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao entrar",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (!data.user) {
        toast({
          title: "Erro ao entrar",
          description: "Usuário não encontrado",
          variant: "destructive",
        });
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "barber")
        .single();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Esta conta não tem acesso de profissional. Use o login principal.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso",
      });

      navigate("/barbeiro");

    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            Acesso Profissional
          </CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isRecaptchaReady}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              É dono de barbearia?{" "}
              <a href="/auth" className="text-primary hover:underline">
                Acesse aqui
              </a>
            </p>
          </div>

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
