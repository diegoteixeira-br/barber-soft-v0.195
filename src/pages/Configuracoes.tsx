import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Link2, Shield, Ban } from "lucide-react";
import { BusinessProfileTab } from "@/components/configuracoes/BusinessProfileTab";
import { IntegrationTab } from "@/components/configuracoes/IntegrationTab";
import { SecurityTab } from "@/components/configuracoes/SecurityTab";
import { CancellationPolicyTab } from "@/components/configuracoes/CancellationPolicyTab";

export default function Configuracoes() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
          <p className="mt-1 text-muted-foreground">Personalize seu sistema</p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="cancellation" className="gap-2">
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">Cancelamento</span>
            </TabsTrigger>
            <TabsTrigger value="integration" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Integração</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile">
              <BusinessProfileTab />
            </TabsContent>
            <TabsContent value="cancellation">
              <CancellationPolicyTab />
            </TabsContent>
            <TabsContent value="integration">
              <IntegrationTab />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
