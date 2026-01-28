import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSaasSettings, PlanFeature } from "@/hooks/useSaasSettings";
import { Settings2, Plus, Trash2, GripVertical, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function PlanFeaturesCard() {
  const { features, isFeaturesLoading, updateFeature, createFeature, deleteFeature, isUpdatingFeature } = useSaasSettings();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [newFeature, setNewFeature] = useState({
    feature_key: "",
    feature_name: "",
    feature_type: "boolean" as 'limit' | 'boolean',
    inicial_value: "false",
    profissional_value: "true",
    franquias_value: "true",
    display_order: 0
  });

  const handleSyncStripe = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe-products');
      
      if (error) throw new Error(error.message);
      
      if (data.success) {
        toast.success("Features sincronizadas com Stripe!");
      } else {
        toast.error(data.error || "Erro na sincronização");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erro ao sincronizar features com Stripe");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleValueChange = (feature: PlanFeature, plan: 'inicial' | 'profissional' | 'franquias', value: string) => {
    const updates: Partial<PlanFeature> & { id: string } = { id: feature.id };
    if (plan === 'inicial') updates.inicial_value = value;
    if (plan === 'profissional') updates.profissional_value = value;
    if (plan === 'franquias') updates.franquias_value = value;
    updateFeature(updates);
  };

  const handleAddFeature = () => {
    createFeature({
      ...newFeature,
      display_order: features.length + 1
    });
    setIsAddDialogOpen(false);
    setNewFeature({
      feature_key: "",
      feature_name: "",
      feature_type: "boolean",
      inicial_value: "false",
      profissional_value: "true",
      franquias_value: "true",
      display_order: 0
    });
  };

  const renderValueInput = (feature: PlanFeature, plan: 'inicial' | 'profissional' | 'franquias') => {
    const value = feature[`${plan}_value`] || "";
    
    if (feature.feature_type === 'boolean') {
      return (
        <Switch
          checked={value === 'true'}
          onCheckedChange={(checked) => handleValueChange(feature, plan, checked ? 'true' : 'false')}
          disabled={isUpdatingFeature}
        />
      );
    }
    
    return (
      <Input
        value={value}
        onChange={(e) => handleValueChange(feature, plan, e.target.value)}
        className="bg-slate-900 border-slate-700 text-white h-8 w-24 text-center"
        placeholder="Valor"
        disabled={isUpdatingFeature}
      />
    );
  };

  if (isFeaturesLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-slate-400">Carregando features...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white">Features por Plano</CardTitle>
              <CardDescription className="text-slate-400">
                Configure o que cada plano oferece
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSyncStripe}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Stripe"}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Feature
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Adicionar Feature</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-slate-300">Chave (identificador único)</Label>
                    <Input
                      value={newFeature.feature_key}
                      onChange={(e) => setNewFeature({ ...newFeature, feature_key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="ex: max_clients"
                      className="bg-slate-900 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Nome de exibição</Label>
                    <Input
                      value={newFeature.feature_name}
                      onChange={(e) => setNewFeature({ ...newFeature, feature_name: e.target.value })}
                      placeholder="ex: Clientes Máximos"
                      className="bg-slate-900 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Tipo</Label>
                    <Select
                      value={newFeature.feature_type}
                      onValueChange={(value: 'limit' | 'boolean') => setNewFeature({ ...newFeature, feature_type: value })}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boolean">Sim/Não</SelectItem>
                        <SelectItem value="limit">Limite numérico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-slate-400 text-xs">Inicial</Label>
                      <Input
                        value={newFeature.inicial_value}
                        onChange={(e) => setNewFeature({ ...newFeature, inicial_value: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Profissional</Label>
                      <Input
                        value={newFeature.profissional_value}
                        onChange={(e) => setNewFeature({ ...newFeature, profissional_value: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Franquias</Label>
                      <Input
                        value={newFeature.franquias_value}
                        onChange={(e) => setNewFeature({ ...newFeature, franquias_value: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddFeature}
                    disabled={!newFeature.feature_key || !newFeature.feature_name}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Adicionar Feature
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-sm font-medium py-3 px-2">Feature</th>
                <th className="text-center text-slate-400 text-sm font-medium py-3 px-2 w-28">Inicial</th>
                <th className="text-center text-blue-400 text-sm font-medium py-3 px-2 w-28">Profissional</th>
                <th className="text-center text-amber-400 text-sm font-medium py-3 px-2 w-28">Franquias</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-white text-sm">{feature.feature_name}</p>
                        <p className="text-slate-500 text-xs">{feature.feature_key}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2">
                    {renderValueInput(feature, 'inicial')}
                  </td>
                  <td className="text-center py-3 px-2">
                    {renderValueInput(feature, 'profissional')}
                  </td>
                  <td className="text-center py-3 px-2">
                    {renderValueInput(feature, 'franquias')}
                  </td>
                  <td className="py-3 px-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                      onClick={() => setFeatureToDelete(feature.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {features.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            Nenhuma feature cadastrada. Clique em "Nova Feature" para adicionar.
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!featureToDelete} onOpenChange={() => setFeatureToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover Feature?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. A feature será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (featureToDelete) {
                  deleteFeature(featureToDelete);
                  setFeatureToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}