import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2, Send, CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export function IntegrationTab() {
  const { settings, isLoading, updateSettings, testWebhook } = useBusinessSettings();
  
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings?.webhook_url) {
      setWebhookUrl(settings.webhook_url);
    }
  }, [settings]);

  const handleTest = async () => {
    if (!webhookUrl) return;
    
    setTesting(true);
    setTestStatus(null);
    
    const result = await testWebhook(webhookUrl);
    setTestStatus(result);
    setTesting(false);
  };

  const handleSave = () => {
    updateSettings.mutate({ webhook_url: webhookUrl || null });
  };

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
          Integração (API)
        </CardTitle>
        <CardDescription>
          Configure webhooks para integrar com sistemas externos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-muted/50 border-border">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Cole aqui a URL do seu webhook do n8n para receber notificações de agendamentos via WhatsApp.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="webhook_url">Webhook URL (WhatsApp AI)</Label>
          <Input
            id="webhook_url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://n8n.seudominio.com/webhook/xyz"
          />
        </div>

        {testStatus && (
          <Alert className={testStatus.success ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"}>
            {testStatus.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription className={testStatus.success ? "text-green-400" : "text-destructive"}>
              {testStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!webhookUrl || testing}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Testar Conexão
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Webhook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
