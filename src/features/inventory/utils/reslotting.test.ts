import { describe, expect, test } from 'bun:test';
import { computeReslottingSuggestions } from './reslotting';

describe('computeReslottingSuggestions', () => {
  test('recommends moving FEFO lot closer to dock', () => {
    const suggestions = computeReslottingSuggestions(
      [
        {
          id: 'lot-a',
          lotNo: 'LOT-A',
          skuId: 'sku-1',
          locationId: 'loc-far',
          locationCode: 'B-001',
          locationType: 'rack',
          distanceToDock: 80,
          receivedDate: '2026-06-01',
          expiryDate: '2026-07-15',
          qty: 10,
          storageClass: 'FEFO',
          weight: 20,
          allocationSortField: 'expiry_date',
          allocationSortDirection: 'asc'
        },
        {
          id: 'lot-b',
          lotNo: 'LOT-B',
          skuId: 'sku-1',
          locationId: 'loc-near',
          locationCode: 'A-001',
          locationType: 'rack',
          distanceToDock: 10,
          receivedDate: '2026-06-10',
          expiryDate: '2026-10-15',
          qty: 10,
          storageClass: 'FEFO',
          weight: 20,
          allocationSortField: 'expiry_date',
          allocationSortDirection: 'asc'
        }
      ],
      [
        {
          id: 'loc-far',
          code: 'B-001',
          type: 'rack',
          distanceToDock: 80,
          capacityVolume: 20,
          capacityWeight: 500
        },
        {
          id: 'loc-near',
          code: 'A-001',
          type: 'rack',
          distanceToDock: 10,
          capacityVolume: 20,
          capacityWeight: 500
        },
        {
          id: 'loc-open',
          code: 'A-002',
          type: 'rack',
          distanceToDock: 12,
          capacityVolume: 20,
          capacityWeight: 500
        }
      ]
    );
    expect(suggestions[0]?.lotId).toBe('lot-a');
    expect(suggestions[0]?.recommendedLocationCode).toBe('A-001');
    expect(suggestions[0]?.ruleApplied).toBe('FEFO');
  });
});
