import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, Loader2, XCircle, QrCode } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";

export function IntegrationTab() {
  const { company, isLoading, updateCompany } = useCompany();
  const [showQRCode, setShowQRCode] = useState(false);

  const isConnected = !!company?.evolution_api_key;

  const handleConnect = () => {
    setShowQRCode(true);
  };

  const handleConfirmConnection = () => {
    updateCompany.mutate({
      evolution_instance_name: company?.name || "Minha Barbearia",
      evolution_api_key: "connected_" + Date.now()
    });
    setShowQRCode(false);
  };

  const handleDisconnect = () => {
    updateCompany.mutate({
      evolution_instance_name: null,
      evolution_api_key: null
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className={`border-2 transition-colors ${isConnected ? 'border-green-500/50 bg-green-500/5' : 'border-border bg-card'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className={`h-5 w-5 ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            <CardTitle>Conexão WhatsApp</CardTitle>
          </div>
          {isConnected && (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          )}
        </div>
        <CardDescription>
          {isConnected 
            ? "Seu WhatsApp está conectado e pronto para enviar notificações" 
            : "Conecte seu WhatsApp para enviar notificações automáticas"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado: Conectado */}
        {isConnected && !showQRCode && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 animate-pulse" />
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">WhatsApp Conectado!</h3>
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {company?.evolution_instance_name || company?.name || "Sua Barbearia"}
              </p>
              <p className="text-sm text-muted-foreground">
                Pronto para enviar mensagens aos clientes
              </p>
            </div>

            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={updateCompany.isPending}
              className="mt-2"
            >
              {updateCompany.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Desconectar
            </Button>
          </div>
        )}

        {/* Estado: Desconectado - Mostrar botão de conectar */}
        {!isConnected && !showQRCode && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-medium text-foreground">WhatsApp não conectado</h3>
              <p className="text-sm text-muted-foreground">
                Conecte para enviar lembretes automáticos de agendamento
              </p>
            </div>

            <Button 
              size="lg" 
              onClick={handleConnect}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Conectar WhatsApp
            </Button>
          </div>
        )}

        {/* Estado: Mostrando QR Code */}
        {showQRCode && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Escaneie o QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp no seu celular e escaneie o código abaixo
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="w-64 h-64 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/30 flex items-center justify-center">
              <div className="text-center space-y-2">
                <QrCode className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                <p className="text-xs text-muted-foreground">QR Code será exibido aqui</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowQRCode(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmConnection}
                disabled={updateCompany.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {updateCompany.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Já escaneei
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Após escanear, clique em "Já escaneei" para confirmar a conexão
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
