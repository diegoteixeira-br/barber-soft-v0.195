import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Handshake } from "lucide-react";
import { format, addMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AdminCompany } from "@/hooks/useAdminCompanies";

interface PartnershipModalProps {
  company: AdminCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: (data: {
    companyId: string;
    planType: string;
    startsAt: string;
    endsAt: string;
    notes: string;
  }) => void;
  onRenew: (data: {
    companyId: string;
    newEndDate: string;
    notes: string;
  }) => void;
  isLoading?: boolean;
}

const durationOptions = [
  { value: "1", label: "1 mês" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "1 ano" },
  { value: "custom", label: "Personalizado" },
];

export function PartnershipModal({
  company,
  open,
  onOpenChange,
  onActivate,
  onRenew,
  isLoading,
}: PartnershipModalProps) {
  const [planType, setPlanType] = useState("profissional");
  const [duration, setDuration] = useState("12");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addMonths(new Date(), 12));
  const [notes, setNotes] = useState("");

  const isRenewal = company?.is_partner && company?.partner_ends_at;

  useEffect(() => {
    if (open && company) {
      if (isRenewal) {
        // For renewal, start from current end date
        const currentEnd = new Date(company.partner_ends_at!);
        setStartDate(currentEnd);
        setEndDate(addMonths(currentEnd, 12));
        setPlanType(company.plan_type || "profissional");
        setNotes(company.partner_notes || "");
      } else {
        // New partnership
        setStartDate(new Date());
        setEndDate(addMonths(new Date(), 12));
        setPlanType(company.plan_type || "profissional");
        setNotes("");
      }
      setDuration("12");
    }
  }, [open, company, isRenewal]);

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (value !== "custom") {
      const months = parseInt(value);
      setEndDate(addMonths(startDate, months));
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      if (duration !== "custom") {
        const months = parseInt(duration);
        setEndDate(addMonths(date, months));
      }
    }
  };

  const handleSubmit = () => {
    if (!company) return;

    if (isRenewal) {
      onRenew({
        companyId: company.id,
        newEndDate: endDate.toISOString(),
        notes,
      });
    } else {
      onActivate({
        companyId: company.id,
        planType,
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        notes,
      });
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Handshake className="h-5 w-5 text-purple-400" />
            {isRenewal ? "Renovar Parceria" : "Ativar Parceria"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Name */}
          <div>
            <Label className="text-slate-400 text-sm">Barbearia</Label>
            <p className="text-white font-medium mt-1">
              {company.business_name || company.name}
            </p>
            {isRenewal && (
              <p className="text-xs text-slate-400 mt-1">
                {company.partner_renewed_count || 0} renovações anteriores
              </p>
            )}
          </div>

          {/* Plan Type Selection - Only for new partnerships */}
          {!isRenewal && (
            <div className="space-y-3">
              <Label className="text-slate-300">Plano com Acesso</Label>
              <RadioGroup
                value={planType}
                onValueChange={setPlanType}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inicial" id="inicial" className="border-slate-500" />
                  <Label htmlFor="inicial" className="text-slate-300 cursor-pointer">
                    Inicial
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="profissional" id="profissional" className="border-slate-500" />
                  <Label htmlFor="profissional" className="text-slate-300 cursor-pointer">
                    Profissional
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="franquias" id="franquias" className="border-slate-500" />
                  <Label htmlFor="franquias" className="text-slate-300 cursor-pointer">
                    Franquias
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Duration Selection */}
          <div className="space-y-3">
            <Label className="text-slate-300">Período da Parceria</Label>
            <Select value={duration} onValueChange={handleDurationChange}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {durationOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white focus:bg-slate-600"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    locale={ptBR}
                    className="bg-slate-700 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Data Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={ptBR}
                    className="bg-slate-700 text-white"
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Notas/Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Parceria fechada na feira de negócios..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading
              ? "Processando..."
              : isRenewal
              ? "Renovar Parceria"
              : "Ativar Parceria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
