import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // Pages that don't require subscription check
  const exemptPaths = ["/escolher-plano", "/assinatura", "/admin"];

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        // Check if user is super admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "super_admin")
          .maybeSingle();

        if (roleData) {
          setIsSuperAdmin(true);
          setIsLoading(false);
          return;
        }

        // Get company data
        const { data: company } = await supabase
          .from("companies")
          .select("plan_status, trial_ends_at, is_blocked, is_partner, partner_ends_at")
          .eq("owner_user_id", session.user.id)
          .maybeSingle();

        if (!company) {
          setIsLoading(false);
          return;
        }

        setIsBlocked(company.is_blocked || false);

        // Check if blocked
        if (company.is_blocked) {
          setIsLoading(false);
          return;
        }

        // Check trial status - trial expired means user should be blocked
        // Note: Credit card is captured at signup, so Stripe will auto-charge after trial
        // If payment fails, webhook updates status to "overdue"
        if (company.plan_status === "trial") {
          if (company.trial_ends_at) {
            const trialEnd = new Date(company.trial_ends_at);
            const now = new Date();
            const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            setDaysRemaining(days);
            
            if (days <= 0) {
              // Trial has expired and no payment was made
              setIsTrialExpired(true);
            }
          } else {
            // Trial status but no end date - calculate from created_at or use default
            // This handles edge cases where trial_ends_at wasn't set
            setDaysRemaining(7); // Default to showing full trial
          }
        } else if (company.plan_status === "partner" && company.partner_ends_at) {
          const partnerEnd = new Date(company.partner_ends_at);
          const now = new Date();
          const days = Math.ceil((partnerEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          setDaysRemaining(days);
          
          if (days <= 0) {
            // Partner period expired
            setIsTrialExpired(true);
          }
        } else if (company.plan_status === "cancelled" || company.plan_status === "overdue" || company.plan_status === "expired_partner") {
          // Cancelled = user cancelled subscription
          // Overdue = payment failed after trial ended
          // Expired_partner = partnership period ended
          setIsTrialExpired(true);
        }
        // Active status = full access, nothing to do
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Check if current path is exempt
  const isExemptPath = exemptPaths.some(path => location.pathname.startsWith(path));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Blocked account
  if (isBlocked && !isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Conta Bloqueada</h1>
          <p className="text-muted-foreground">
            Sua conta foi bloqueada. Entre em contato com o suporte para mais informações.
          </p>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Trial expired - redirect to plan selection (unless on exempt path)
  if (isTrialExpired && !isSuperAdmin && !isExemptPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <Clock className="h-16 w-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Período de Teste Expirado</h1>
          <p className="text-muted-foreground">
            Seu período de teste gratuito acabou. Escolha um plano para continuar usando o sistema.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/escolher-plano")}>
              Escolher um Plano
            </Button>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
