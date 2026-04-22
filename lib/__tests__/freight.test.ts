import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcFreightCost, geocodeAddress, calculateFreight, FreightZone } from '../freight';

describe('Freight and Distance Utility Tests', () => {

  const MOCK_ZONES: FreightZone[] = [
    { maxKm: 2, cost: 5 },
    { maxKm: 4, cost: 8 },
    { maxKm: 7, cost: 12 },
    { maxKm: 15, cost: 20 },
  ];
  
  const MAX_COST = 30;

  describe('calcFreightCost() - Financial Bounds Security', () => {
    it('deve aplicar custo mínimo para curtas distâncias', () => {
      const result = calcFreightCost(1.5, MOCK_ZONES, MAX_COST);
      expect(result.cost).toBe(5);
    });

    it('deve escalar para zonas intermediárias', () => {
      const result = calcFreightCost(5.5, MOCK_ZONES, MAX_COST);
      expect(result.cost).toBe(12);
    });

    it('deve punir distâncias superiores à zona limite com MAX_COST previnindo vazamentos financeiros', () => {
      const result = calcFreightCost(25, MOCK_ZONES, MAX_COST);
      expect(result.cost).toBe(MAX_COST);
      expect(result.label).toContain('Acima de');
    });

    it('deve lidar corretamente na exata linha de limite', () => {
      const result = calcFreightCost(4, MOCK_ZONES, MAX_COST);
      expect(result.cost).toBe(8); // O teto de 4km é 8 reais
    });
  });

  describe('calculateFreight() - Integrated Service Security', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('deve falhar de forma gracefully se a API Nominatim jogar erro de rede 500 ou não encontrar dados', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
      });

      const config = {
        storeLat: -20.0, storeLng: -40.0,
        zones: MOCK_ZONES, maxCost: MAX_COST
      };
      
      const result = await calculateFreight("Rua Inexistente e Errada, 800000X", config);
      expect(result).toBeNull();
    });

    it('deve retornar a cotação exata e prevenir injeções de lat/lng ao geocodificar corretamente a string', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "-20.0100", lon: "-40.0100" }]
      });

      const config = {
        storeLat: -20.0000, storeLng: -40.0000,
        zones: MOCK_ZONES, maxCost: MAX_COST
      };

      const result = await calculateFreight("Av Valida, 123", config);
      
      expect(result).not.toBeNull();
      expect(result!.distanceKm).toBeGreaterThan(0);
      expect(result!.freightCost).toBeGreaterThanOrEqual(5); // Minimum configured cost
    });
  });
});
