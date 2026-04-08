"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FreightZone {
  maxKm: number;
  cost: number;
}

export interface StoreSettings {
  storeLat: number;
  storeLng: number;
  storeAddress: string;
  zones: FreightZone[];
  maxCost: number;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeLat: -20.5572,
  storeLng: -48.5697,
  storeAddress: "Centro, Barretos - SP",
  zones: [
    { maxKm: 2,  cost: 5  },
    { maxKm: 4,  cost: 8  },
    { maxKm: 7,  cost: 12 },
    { maxKm: 10, cost: 15 },
    { maxKm: 15, cost: 20 },
  ],
  maxCost: 30,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value");

    if (error || !data?.length) return DEFAULT_SETTINGS;

    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));

    return {
      storeLat: parseFloat(map.store_lat ?? String(DEFAULT_SETTINGS.storeLat)),
      storeLng: parseFloat(map.store_lng ?? String(DEFAULT_SETTINGS.storeLng)),
      storeAddress: map.store_address ?? DEFAULT_SETTINGS.storeAddress,
      zones: [
        { maxKm: parseFloat(map.freight_zone_1_km ?? "2"),  cost: parseFloat(map.freight_zone_1_cost ?? "5")  },
        { maxKm: parseFloat(map.freight_zone_2_km ?? "4"),  cost: parseFloat(map.freight_zone_2_cost ?? "8")  },
        { maxKm: parseFloat(map.freight_zone_3_km ?? "7"),  cost: parseFloat(map.freight_zone_3_cost ?? "12") },
        { maxKm: parseFloat(map.freight_zone_4_km ?? "10"), cost: parseFloat(map.freight_zone_4_cost ?? "15") },
        { maxKm: parseFloat(map.freight_zone_5_km ?? "15"), cost: parseFloat(map.freight_zone_5_cost ?? "20") },
      ],
      maxCost: parseFloat(map.freight_zone_max_cost ?? "30"),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveStoreSettings(settings: StoreSettings) {
  const supabase = await createClient();

  const rows = [
    { key: "store_lat",            value: String(settings.storeLat) },
    { key: "store_lng",            value: String(settings.storeLng) },
    { key: "store_address",        value: settings.storeAddress },
    { key: "freight_zone_1_km",    value: String(settings.zones[0].maxKm) },
    { key: "freight_zone_1_cost",  value: String(settings.zones[0].cost) },
    { key: "freight_zone_2_km",    value: String(settings.zones[1].maxKm) },
    { key: "freight_zone_2_cost",  value: String(settings.zones[1].cost) },
    { key: "freight_zone_3_km",    value: String(settings.zones[2].maxKm) },
    { key: "freight_zone_3_cost",  value: String(settings.zones[2].cost) },
    { key: "freight_zone_4_km",    value: String(settings.zones[3].maxKm) },
    { key: "freight_zone_4_cost",  value: String(settings.zones[3].cost) },
    { key: "freight_zone_5_km",    value: String(settings.zones[4].maxKm) },
    { key: "freight_zone_5_cost",  value: String(settings.zones[4].cost) },
    { key: "freight_zone_max_cost",value: String(settings.maxCost) },
  ];

  const { error } = await supabase
    .from("store_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    return { error: "Erro ao salvar configurações." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
