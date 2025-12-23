import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Upload, Loader2 } from "lucide-react";
import { useBusinessSettings, BusinessSettingsInput } from "@/hooks/useBusinessSettings";

export function BusinessProfileTab() {
  const { settings, isLoading, updateSettings, uploadLogo } = useBusinessSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<BusinessSettingsInput>({
    business_name: "",
    logo_url: null,
    opening_time: "09:00",
    closing_time: "19:00",
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || "",
        logo_url: settings.logo_url,
        opening_time: settings.opening_time || "09:00",
        closing_time: settings.closing_time || "19:00",
      });
      setPreviewUrl(settings.logo_url);
    }
  }, [settings]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload
    setUploading(true);
    const publicUrl = await uploadLogo(file);
    setUploading(false);

    if (publicUrl) {
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
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
          <Building2 className="h-5 w-5 text-primary" />
          Perfil da Barbearia
        </CardTitle>
        <CardDescription>
          Configure as informações básicas do seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 border-2 border-border">
                <AvatarImage src={previewUrl || undefined} alt="Logo" />
                <AvatarFallback className="bg-muted text-4xl">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Enviando..." : "Fazer Upload"}
              </Button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Nome da Empresa</Label>
                <Input
                  id="business_name"
                  value={formData.business_name || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Ex: Barbearia Premium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening_time">Horário de Abertura</Label>
                  <Input
                    id="opening_time"
                    type="time"
                    value={formData.opening_time || "09:00"}
                    onChange={(e) => setFormData(prev => ({ ...prev, opening_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing_time">Horário de Fechamento</Label>
                  <Input
                    id="closing_time"
                    type="time"
                    value={formData.closing_time || "19:00"}
                    onChange={(e) => setFormData(prev => ({ ...prev, closing_time: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
