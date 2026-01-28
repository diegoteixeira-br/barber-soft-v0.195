import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionContextType {
  isTrialExpired: boolean;
  isTrialing: boolean;
  daysRemaining: number | null;
  planStatus: string | null;
  planType: string | null;
  isActive: boolean;
  isPartner: boolean;
  isBlocked: boolean;
  isSuperAdmin: boolean;
  canCreateData: boolean;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user is super admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleData) {
        setIsSuperAdmin(true);
        setIsActive(true);
        setIsTrialExpired(false);
        return;
      }

      // Get company data
      const { data: company } = await supabase
        .from("companies")
        .select("plan_status, plan_type, trial_ends_at, is_blocked, is_partner, partner_ends_at")
        .eq("owner_user_id", session.user.id)
        .maybeSingle();

      if (!company) return;

      setPlanStatus(company.plan_status);
      setPlanType(company.plan_type);
      setIsBlocked(company.is_blocked || false);
      setIsPartner(company.is_partner || false);

      // Check trial status
      if (company.plan_status === "trial" && company.trial_ends_at) {
        const trialEnd = new Date(company.trial_ends_at);
        const now = new Date();
        const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        setDaysRemaining(Math.max(0, days));
        setIsTrialing(true);
        setIsTrialExpired(days <= 0);
        setIsActive(days > 0);
      } else if (company.plan_status === "partner" && company.partner_ends_at) {
        const partnerEnd = new Date(company.partner_ends_at);
        const now = new Date();
        const days = Math.ceil((partnerEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        setDaysRemaining(Math.max(0, days));
        setIsActive(days > 0);
        setIsTrialExpired(false);
      } else if (company.plan_status === "active") {
        setIsActive(true);
        setIsTrialExpired(false);
        setIsTrialing(false);
      } else if (company.plan_status === "cancelled" || company.plan_status === "overdue") {
        setIsActive(false);
        setIsTrialExpired(true);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    
    // Refresh every minute
    const interval = setInterval(checkSubscription, 60000);
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(checkSubscription, 0);
    });
    
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  // Can create data if: active, not blocked, and (not trial expired OR is super admin)
  const canCreateData = (isActive || isSuperAdmin) && !isBlocked && !isTrialExpired;

  return (
    <SubscriptionContext.Provider
      value={{
        isTrialExpired,
        isTrialing,
        daysRemaining,
        planStatus,
        planType,
        isActive,
        isPartner,
        isBlocked,
        isSuperAdmin,
        canCreateData,
        checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
  }
  return context;
}
