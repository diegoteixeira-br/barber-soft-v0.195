import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Building2 } from "lucide-react";
import { Client, CreateClientData } from "@/hooks/useClients";
import { Unit } from "@/hooks/useUnits";

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave?: (data: Partial<Client> & { id: string }) => void;
  onCreate?: (data: CreateClientData) => void;
  isLoading?: boolean;
  initialName?: string;
  units?: Unit[];
  defaultUnitId?: string;
}

const PREDEFINED_TAGS = ["VIP", "Novo", "Frequente", "Sumido"];

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSave,
  onCreate,
  isLoading,
  initialName = "",
  units = [],
  defaultUnitId,
}: ClientFormModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const isEditMode = !!client;
  const showUnitSelector = !isEditMode && units.length > 1;

  useEffect(() => {
    if (open) {
      if (client) {
        setName(client.name);
        setPhone(client.phone);
        setBirthDate(client.birth_date || "");
        setNotes(client.notes || "");
        setTags(client.tags || []);
        setSelectedUnitId(client.unit_id);
      } else {
        setName(initialName);
        setPhone("");
        setBirthDate("");
        setNotes("");
        setTags([]);
        setSelectedUnitId(defaultUnitId || (units.length === 1 ? units[0].id : ""));
      }
      setNewTag("");
    }
  }, [client, open, initialName, defaultUnitId, units]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && client && onSave) {
      onSave({
        id: client.id,
        name,
        phone,
        birth_date: birthDate || null,
        notes: notes || null,
        tags,
      });
    } else if (onCreate) {
      onCreate({
        name,
        phone,
        birth_date: birthDate || null,
        notes: notes || null,
        tags,
        unit_id: selectedUnitId || undefined,
      });
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const getUnitName = () => {
    if (!client) return null;
    const unit = units.find(u => u.id === client.unit_id);
    return unit?.name || "Unidade desconhecida";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditMode ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Selector for new clients */}
          {showUnitSelector && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId} required>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show unit info for editing */}
          {isEditMode && units.length > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2">
              <Building2 className="h-4 w-4" />
              <span>Unidade: <strong className="text-foreground">{getUnitName()}</strong></span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(99) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Gosta de café sem açúcar, prefere corte baixo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {tags.filter((t) => !PREDEFINED_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags
                  .filter((t) => !PREDEFINED_TAGS.includes(t))
                  .map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Nova tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addCustomTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || (showUnitSelector && !selectedUnitId)}>
              {isLoading ? "Salvando..." : isEditMode ? "Salvar" : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
