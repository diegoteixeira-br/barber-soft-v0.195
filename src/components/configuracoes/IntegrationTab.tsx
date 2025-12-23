import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2, CheckCircle2, Loader2, Info, Key, Server } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";

export function IntegrationTab() {
  const { company, isLoading, updateCompany } = useCompany();
  
  const [instanceName, setInstanceName] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (company) {
      setInstanceName(company.evolution_instance_name || "");
      setApiKey(company.evolution_api_key || "");
    }
  }, [company]);

  const handleSave = () => {
    updateCompany.mutate({ 
      evolution_instance_name: instanceName || null,
      evolution_api_key: apiKey || null
    });
  };

  const isConfigured = company?.evolution_instance_name && company?.evolution_api_key;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Integração (Evolution API)
        </CardTitle>
        <CardDescription>
          Configure a Evolution API para enviar notificações via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-muted/50 border-border">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure sua instância da Evolution API para habilitar notificações automáticas de agendamentos via WhatsApp.
          </AlertDescription>
        </Alert>

        {isConfigured && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              Evolution API configurada com sucesso!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instance_name" className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              Nome da Instância (Evolution API)
            </Label>
            <Input
              id="instance_name"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="minha-instancia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key" className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              API Key (Evolution API)
            </Label>
            <Input
              id="api_key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sua-api-key-aqui"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateCompany.isPending}>
          {updateCompany.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
