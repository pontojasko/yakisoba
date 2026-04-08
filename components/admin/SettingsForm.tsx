"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStoreSettings, StoreSettings } from "@/app/actions/settings";
import { Loader2, MapPin, Truck, Save, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SettingsFormProps {
  initial: StoreSettings;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const [storeLat, setStoreLat] = useState(String(initial.storeLat));
  const [storeLng, setStoreLng] = useState(String(initial.storeLng));
  const [storeAddress, setStoreAddress] = useState(initial.storeAddress);
  const [zones, setZones] = useState(initial.zones.map((z) => ({
    maxKm: String(z.maxKm),
    cost: String(z.cost),
  })));
  const [maxCost, setMaxCost] = useState(String(initial.maxCost));

  function updateZone(idx: number, field: "maxKm" | "cost", val: string) {
    setZones((prev) => prev.map((z, i) => i === idx ? { ...z, [field]: val } : z));
  }

  function addZone() {
    setZones((prev) => [...prev, { maxKm: "", cost: "" }]);
  }

  function removeZone(idx: number) {
    setZones((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    const parsed: StoreSettings = {
      storeLat: parseFloat(storeLat),
      storeLng: parseFloat(storeLng),
      storeAddress,
      zones: zones
        .filter((z) => z.maxKm && z.cost)
        .map((z) => ({ maxKm: parseFloat(z.maxKm), cost: parseFloat(z.cost) }))
        .sort((a, b) => a.maxKm - b.maxKm),
      maxCost: parseFloat(maxCost),
    };

    if (isNaN(parsed.storeLat) || isNaN(parsed.storeLng)) {
      toast.error("Coordenadas inválidas.");
      return;
    }

    startTransition(async () => {
      const result = await saveStoreSettings(parsed);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Configurações salvas!");
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Store Location */}
      <section className="bg-card rounded-2xl border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-base">Localização do Estabelecimento</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-address">Endereço (referência para o cupom)</Label>
          <Input
            id="store-address"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            placeholder="Ex: Rua 13, 500, Centro, Barretos - SP"
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="store-lat">Latitude</Label>
            <Input
              id="store-lat"
              value={storeLat}
              onChange={(e) => setStoreLat(e.target.value)}
              placeholder="-20.5572"
              className="h-11 font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-lng">Longitude</Label>
            <Input
              id="store-lng"
              value={storeLng}
              onChange={(e) => setStoreLng(e.target.value)}
              placeholder="-48.5697"
              className="h-11 font-mono text-sm"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Para obter as coordenadas, abra{" "}
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            Google Maps
          </a>
          {" "}no endereço do estabelecimento, clique com o botão direito e escolha{" "}
          <strong>"O que há aqui?"</strong>. As coordenadas aparecem no rodapé.
        </p>
      </section>

      {/* Freight Zones */}
      <section className="bg-card rounded-2xl border p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Tabela de Frete</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addZone}
            className="gap-1.5 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Adicionar faixa
          </Button>
        </div>

        <div className="space-y-3">
          {zones.map((zone, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Até (km)</Label>
                  <Input
                    value={zone.maxKm}
                    onChange={(e) => updateZone(idx, "maxKm", e.target.value)}
                    placeholder="Ex: 5"
                    type="number"
                    min="0"
                    step="0.5"
                    className="h-10 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Custo (R$)</Label>
                  <Input
                    value={zone.cost}
                    onChange={(e) => updateZone(idx, "cost", e.target.value)}
                    placeholder="Ex: 10"
                    type="number"
                    min="0"
                    step="0.5"
                    className="h-10 font-mono text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => removeZone(idx)}
                className="mt-4 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remover faixa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Max cost fallback */}
        <div className="pt-2 border-t space-y-2">
          <Label htmlFor="max-cost">Custo máximo (acima da última faixa)</Label>
          <Input
            id="max-cost"
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
            placeholder="Ex: 30"
            type="number"
            min="0"
            step="0.5"
            className="h-11 font-mono text-sm w-48"
          />
        </div>

        {/* Preview */}
        {zones.filter((z) => z.maxKm && z.cost).length > 0 && (
          <div className="rounded-xl bg-muted/50 p-3 space-y-1 text-sm">
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Prévia da tabela
            </p>
            {zones
              .filter((z) => z.maxKm && z.cost)
              .sort((a, b) => parseFloat(a.maxKm) - parseFloat(b.maxKm))
              .map((z, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">Até {z.maxKm} km</span>
                  <span className="font-medium">{formatCurrency(parseFloat(z.cost))}</span>
                </div>
              ))}
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="text-muted-foreground">Acima disso</span>
              <span className="font-medium">{formatCurrency(parseFloat(maxCost) || 0)}</span>
            </div>
          </div>
        )}
      </section>

      <Button
        onClick={handleSave}
        disabled={isPending}
        size="lg"
        className="gap-2 rounded-full w-full sm:w-auto"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
