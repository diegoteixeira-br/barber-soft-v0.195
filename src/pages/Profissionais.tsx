import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Users, Loader2, Building2 } from "lucide-react";
import { useBarbers, Barber } from "@/hooks/useBarbers";
import { useUnits } from "@/hooks/useUnits";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { BarberCard } from "@/components/barbers/BarberCard";
import { BarberFormModal } from "@/components/barbers/BarberFormModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Profissionais() {
  const { currentUnitId, isLoading: unitLoading } = useCurrentUnit();
  const { units } = useUnits();
  const [unitFilter, setUnitFilter] = useState<string>("current");
  
  // Determine the unit ID to use for fetching barbers
  const effectiveUnitId = unitFilter === "all" ? null : (unitFilter === "current" ? currentUnitId : unitFilter);
  
  const { barbers, isLoading, createBarber, updateBarber, deleteBarber, toggleActive } = useBarbers(effectiveUnitId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const handleOpenModal = (barber?: Barber) => {
    setEditingBarber(barber || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBarber(null);
  };

  const handleSubmit = (data: any) => {
    if (editingBarber) {
      updateBarber.mutate({ id: editingBarber.id, ...data }, {
        onSuccess: handleCloseModal
      });
    } else {
      createBarber.mutate(data, {
        onSuccess: handleCloseModal
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteBarber.mutate(id);
  };

  const handleToggleActive = (id: string, is_active: boolean) => {
    toggleActive.mutate({ id, is_active });
  };

  const showUnitBadge = unitFilter === "all" && units.length > 1;

  if (unitLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Profissionais</h1>
            <p className="mt-1 text-muted-foreground">Gerencie sua equipe de barbeiros</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Profissional
          </Button>
        </div>

        {/* Unit Filter */}
        {units.length > 1 && (
          <div className="flex items-center gap-3">
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Unidade Atual</SelectItem>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : barbers.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
            <div className="flex flex-col items-center gap-4 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-medium text-foreground">Nenhum profissional cadastrado</h3>
                <p className="text-sm text-muted-foreground">Adicione seu primeiro barbeiro para começar</p>
              </div>
              <Button onClick={() => handleOpenModal()} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Profissional
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                showUnit={showUnitBadge}
              />
            ))}
          </div>
        )}
      </div>

      <BarberFormModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        barber={editingBarber}
        onSubmit={handleSubmit}
        isLoading={createBarber.isPending || updateBarber.isPending}
        units={units}
        defaultUnitId={unitFilter !== "all" && unitFilter !== "current" ? unitFilter : currentUnitId || undefined}
      />
    </DashboardLayout>
  );
}
