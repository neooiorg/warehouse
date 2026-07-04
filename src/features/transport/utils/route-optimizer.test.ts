import { describe, expect, test } from 'bun:test';
import { optimizeRoute } from './route-optimizer';

describe('optimizeRoute', () => {
  test('picks single source when one warehouse covers all demand', () => {
    const result = optimizeRoute(
      [
        { id: 'w1', name: 'HN', lat: 21.02, lng: 105.84, availableQty: 50 },
        { id: 'w2', name: 'DN', lat: 16.05, lng: 108.2, availableQty: 10 }
      ],
      { destination: 'Bac Ninh', destinationLat: 21.18, destinationLng: 106.07, qtyRequired: 20 },
      { fuelPricePerLiter: 20000 }
    );
    expect(result.coverageMode).toBe('single');
    expect(result.coveredQty).toBe(20);
    expect(result.stops).toHaveLength(1);
  });

  test('builds multi source route when no warehouse can cover alone', () => {
    const result = optimizeRoute(
      [
        { id: 'w1', name: 'HN', lat: 21.02, lng: 105.84, availableQty: 20 },
        { id: 'w2', name: 'DN', lat: 16.05, lng: 108.2, availableQty: 20 },
        { id: 'w3', name: 'HCM', lat: 10.82, lng: 106.62, availableQty: 10 }
      ],
      { destination: 'Can Tho', destinationLat: 10.04, destinationLng: 105.74, qtyRequired: 30 },
      { fuelPricePerLiter: 20000 }
    );
    expect(result.coverageMode).toBe('multi');
    expect(result.coveredQty).toBe(30);
    expect(result.freightCostVnd).toBeGreaterThan(0);
  });
});
