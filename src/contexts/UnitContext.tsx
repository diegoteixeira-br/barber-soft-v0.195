import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useUnits } from "@/hooks/useUnits";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";

interface UnitContextType {
  currentUnitId: string | null;
  setCurrentUnitId: (id: string | null) => void;
  currentCompanyId: string | null;
  isLoading: boolean;
}

const UnitContext = createContext<UnitContextType | null>(null);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
  const { company, isLoading: companyLoading, createCompany } = useCompany();
  const { units, isLoading: unitsLoading, createUnit } = useUnits(company?.id || null);
  const companyCreatingRef = useRef(false);
  const unitCreatingRef = useRef(false);

  const isLoading = companyLoading || unitsLoading;

  // Auto-create company and default unit if none exists
  useEffect(() => {
    const initCompanyAndUnit = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create company if doesn't exist (only once)
      if (!companyLoading && !company && !companyCreatingRef.current && !createCompany.isPending) {
        companyCreatingRef.current = true;
        createCompany.mutate({ name: "Minha Empresa" }, {
          onSettled: () => {
            companyCreatingRef.current = false;
          }
        });
        return;
      }

      // Create default unit if company exists but no units (only once)
      if (company && !unitsLoading && units.length === 0 && !unitCreatingRef.current && !createUnit.isPending) {
        unitCreatingRef.current = true;
        createUnit.mutate({ name: "Barbearia Principal" }, {
          onSettled: () => {
            unitCreatingRef.current = false;
          }
        });
      } else if (!unitsLoading && units.length > 0 && !currentUnitId) {
        setCurrentUnitId(units[0].id);
      }
    };
    initCompanyAndUnit();
  }, [company, companyLoading, units, unitsLoading, currentUnitId]);

  // Update currentUnitId when units change and we have a new default unit
  useEffect(() => {
    if (units.length > 0 && !currentUnitId) {
      setCurrentUnitId(units[0].id);
    }
  }, [units]);

  return (
    <UnitContext.Provider value={{ 
      currentUnitId, 
      setCurrentUnitId, 
      currentCompanyId: company?.id || null,
      isLoading 
    }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useCurrentUnit() {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error("useCurrentUnit must be used within a UnitProvider");
  }
  return context;
}
