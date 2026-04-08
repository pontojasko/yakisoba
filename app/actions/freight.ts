"use server";

import { calculateFreight } from "@/lib/freight";
import { getStoreSettings } from "@/app/actions/settings";

export async function getFreightEstimate(address: string) {
  if (!address || address.trim().length < 5) {
    return { error: "Endereço muito curto" };
  }

  const settings = await getStoreSettings();

  const result = await calculateFreight(address, {
    storeLat: settings.storeLat,
    storeLng: settings.storeLng,
    zones: settings.zones,
    maxCost: settings.maxCost,
  });

  if (!result) {
    return { error: "Endereço não encontrado. Tente ser mais específico." };
  }

  return { data: result };
}
