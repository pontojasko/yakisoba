/**
 * Cálculo de frete por distância (Haversine)
 * As configurações de origem e tabela de preços são lidas do banco via getStoreSettings()
 */

export interface FreightResult {
  distanceKm: number;
  freightCost: number;
  label: string;
  estimatedMinutes: number;
}

/** Haversine formula — distância em km entre dois pontos lat/lng */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Tempo estimado em minutos por km */
function estimateMinutes(km: number): number {
  if (km <= 2)  return 20;
  if (km <= 4)  return 30;
  if (km <= 7)  return 40;
  if (km <= 10) return 55;
  if (km <= 15) return 70;
  return 90;
}

export interface FreightZone {
  maxKm: number;
  cost: number;
}

/** Calcula custo a partir de zonas configuráveis */
export function calcFreightCost(
  km: number,
  zones: FreightZone[],
  maxCost: number
): { cost: number; label: string } {
  const sorted = [...zones].sort((a, b) => a.maxKm - b.maxKm);
  for (const zone of sorted) {
    if (km <= zone.maxKm) {
      return { cost: zone.cost, label: `Até ${zone.maxKm} km` };
    }
  }
  const lastZone = sorted[sorted.length - 1];
  return { cost: maxCost, label: `Acima de ${lastZone?.maxKm ?? 15} km` };
}

/**
 * Geocodifica o endereço via Nominatim (OpenStreetMap) — sem chave de API.
 * Retorna null se não encontrar.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${address}, Barretos, SP, Brasil`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "YakiHami-PDV/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/** Calcula o frete a partir de um endereço textual + configurações do banco */
export async function calculateFreight(
  address: string,
  config: { storeLat: number; storeLng: number; zones: FreightZone[]; maxCost: number }
): Promise<FreightResult | null> {
  const coords = await geocodeAddress(address);
  if (!coords) return null;

  const km = haversineKm(config.storeLat, config.storeLng, coords.lat, coords.lng);
  const { cost, label } = calcFreightCost(km, config.zones, config.maxCost);

  return {
    distanceKm: Math.round(km * 10) / 10,
    freightCost: cost,
    label,
    estimatedMinutes: estimateMinutes(km),
  };
}
