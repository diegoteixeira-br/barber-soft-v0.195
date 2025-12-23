import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UnitCard } from "@/components/units/UnitCard";
import { UnitFormModal } from "@/components/units/UnitFormModal";
import { useUnits, Unit } from "@/hooks/useUnits";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Unidades() {
  const { currentCompanyId } = useCurrentUnit();
  const { units, isLoading, createUnit, updateUnit, deleteUnit } = useUnits(currentCompanyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const handleOpenModal = (unit?: Unit) => {
    setEditingUnit(unit || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  const handleSubmit = (data: { name: string; address?: string; phone?: string; manager_name?: string }) => {
    if (editingUnit) {
      updateUnit.mutate({ id: editingUnit.id, ...data }, {
        onSuccess: handleCloseModal,
      });
    } else {
      createUnit.mutate(data, {
        onSuccess: handleCloseModal,
      });
    }
  };

  const handleDelete = () => {
    if (deletingUnit) {
      deleteUnit.mutate(deletingUnit.id, {
        onSuccess: () => setDeletingUnit(null),
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Unidades</h1>
            <p className="mt-1 text-muted-foreground">Gerencie suas filiais</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Unidade
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : units.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
            <div className="flex flex-col items-center gap-4 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-medium text-foreground">Nenhuma unidade cadastrada</h3>
                <p className="text-sm text-muted-foreground">Clique em "Nova Unidade" para começar</p>
              </div>
              <Button onClick={() => handleOpenModal()} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Unidade
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onEdit={handleOpenModal}
                onDelete={setDeletingUnit}
              />
            ))}
          </div>
        )}
      </div>

      <UnitFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        unit={editingUnit}
        isLoading={createUnit.isPending || updateUnit.isPending}
      />

      <AlertDialog open={!!deletingUnit} onOpenChange={() => setDeletingUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados relacionados a esta unidade serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUnit.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
