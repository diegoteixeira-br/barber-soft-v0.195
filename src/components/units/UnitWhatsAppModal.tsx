import { useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Unit } from "@/hooks/useUnits";
import { UnitWhatsAppIntegration, UnitWhatsAppIntegrationRef } from "./UnitWhatsAppIntegration";

interface UnitWhatsAppModalProps {
  open: boolean;
  onClose: () => void;
  unit: Unit | null;
  onConnectionChange?: () => void;
}

export function UnitWhatsAppModal({ open, onClose, unit, onConnectionChange }: UnitWhatsAppModalProps) {
  const integrationRef = useRef<UnitWhatsAppIntegrationRef | null>(null);

  const handleClose = useCallback(async (isOpen: boolean) => {
    if (!isOpen && integrationRef.current) {
      // Cleanup orphaned instance when modal closes during connecting state
      await integrationRef.current.cleanupOnClose();
    }
    onClose();
  }, [onClose]);

  if (!unit) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp - {unit.name}</DialogTitle>
        </DialogHeader>
        <UnitWhatsAppIntegration 
          ref={integrationRef}
          unit={unit} 
          onConnectionChange={onConnectionChange}
          autoConnect={true}
        />
      </DialogContent>
    </Dialog>
  );
}
