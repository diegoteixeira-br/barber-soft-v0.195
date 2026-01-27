import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AdminCompany } from "@/hooks/useAdminCompanies";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Handshake } from "lucide-react";

interface CompanyDetailsModalProps {
  company: AdminCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailsModal({ company, open, onOpenChange }: CompanyDetailsModalProps) {
  if (!company) return null;

  const trialDays = company.trial_ends_at 
    ? differenceInDays(new Date(company.trial_ends_at), new Date())
    : null;

  const partnerDays = company.partner_ends_at
    ? differenceInDays(new Date(company.partner_ends_at), new Date())
    : null;

  const isPartner = company.is_partner && company.plan_status === 'partner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {company.name}
            {isPartner && <Handshake className="h-5 w-5 text-purple-400" />}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Status</p>
              <Badge variant="outline" className={
                company.plan_status === 'active' 
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : company.plan_status === 'trial'
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : company.plan_status === 'partner'
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }>
                {company.plan_status || 'trial'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Plano</p>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {company.plan_type || 'professional'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">ID da Empresa</span>
              <span className="text-white font-mono text-sm">{company.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Criado em</span>
              <span className="text-white">
                {company.created_at 
                  ? format(new Date(company.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Último Login</span>
              <span className="text-white">
                {company.last_login_at 
                  ? format(new Date(company.last_login_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : "Nunca"}
              </span>
            </div>
            {company.plan_status === 'trial' && trialDays !== null && (
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">Trial Termina</span>
                <span className={trialDays <= 3 ? "text-red-400" : "text-white"}>
                  {trialDays} dias restantes
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Mensalidade</span>
              <span className="text-white">
                R$ {(company.monthly_price || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Origem</span>
              <span className="text-white">
                {company.signup_source || "Orgânico"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Bloqueado</span>
              <span className={company.is_blocked ? "text-red-400" : "text-green-400"}>
                {company.is_blocked ? "Sim" : "Não"}
              </span>
            </div>
          </div>

          {/* Partnership Section */}
          {(company.is_partner || company.partner_started_at) && (
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <p className="text-sm font-medium text-purple-400 flex items-center gap-2">
                <Handshake className="h-4 w-4" />
                Parceria
              </p>
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">Status de Parceiro</span>
                <span className={company.is_partner ? "text-purple-400" : "text-slate-400"}>
                  {company.is_partner ? "Ativo" : "Inativo"}
                </span>
              </div>
              {company.partner_started_at && (
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Início da Parceria</span>
                  <span className="text-white">
                    {format(new Date(company.partner_started_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              {company.partner_ends_at && (
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Término da Parceria</span>
                  <span className="text-white">
                    {format(new Date(company.partner_ends_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              {isPartner && partnerDays !== null && (
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Dias Restantes</span>
                  <span className={partnerDays <= 30 ? "text-orange-400" : "text-purple-400"}>
                    {partnerDays} dias
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-700">
                <span className="text-slate-400">Renovações</span>
                <span className="text-white">
                  {company.partner_renewed_count || 0}
                </span>
              </div>
              {company.partner_notes && (
                <div className="py-2">
                  <span className="text-slate-400 block mb-1">Notas da Parceria</span>
                  <p className="text-white text-sm bg-slate-700/50 p-2 rounded">
                    {company.partner_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {(company.stripe_customer_id || company.stripe_subscription_id) && (
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <p className="text-sm font-medium text-white">Stripe</p>
              {company.stripe_customer_id && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Customer ID</span>
                  <span className="text-white font-mono text-sm">
                    {company.stripe_customer_id}
                  </span>
                </div>
              )}
              {company.stripe_subscription_id && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Subscription ID</span>
                  <span className="text-white font-mono text-sm">
                    {company.stripe_subscription_id}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
