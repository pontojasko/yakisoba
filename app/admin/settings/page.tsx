import { getStoreSettings } from "@/app/actions/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Settings2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurações | YakiHami Admin",
};

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Localização do estabelecimento e tabela de frete
          </p>
        </div>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
