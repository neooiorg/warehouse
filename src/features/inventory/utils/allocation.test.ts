import { describe, test, expect } from 'bun:test';
import { allocateLots, type AllocatableLot } from './allocation';

const lots: AllocatableLot[] = [
  { id: 'A', qty: 10, receivedDate: '2026-01-01', expiryDate: '2026-08-01' },
  { id: 'B', qty: 10, receivedDate: '2026-02-01', expiryDate: '2026-09-01' },
  { id: 'C', qty: 10, receivedDate: '2026-03-01', expiryDate: '2026-07-01' }
];

describe('allocateLots', () => {
  test('FIFO (received_date asc) picks oldest-received lot first', () => {
    const result = allocateLots(lots, 5, {
      sortField: 'received_date',
      sortDirection: 'asc'
    });
    expect(result.picks).toEqual([{ lotId: 'A', qty: 5 }]);
    expect(result.shortfallQty).toBe(0);
  });

  test('FEFO (expiry_date asc) picks soonest-to-expire lot first', () => {
    const result = allocateLots(lots, 5, {
      sortField: 'expiry_date',
      sortDirection: 'asc'
    });
    expect(result.picks).toEqual([{ lotId: 'C', qty: 5 }]);
  });

  test('LEFO configured as expiry_date desc picks longest-shelf-life lot first', () => {
    const result = allocateLots(lots, 5, {
      sortField: 'expiry_date',
      sortDirection: 'desc'
    });
    expect(result.picks).toEqual([{ lotId: 'B', qty: 5 }]);
  });

  test('spans multiple lots in order when one lot is insufficient', () => {
    const result = allocateLots(lots, 15, {
      sortField: 'received_date',
      sortDirection: 'asc'
    });
    expect(result.picks).toEqual([
      { lotId: 'A', qty: 10 },
      { lotId: 'B', qty: 5 }
    ]);
    expect(result.fulfilledQty).toBe(15);
    expect(result.shortfallQty).toBe(0);
  });

  test('reports a shortfall when total stock is insufficient', () => {
    const result = allocateLots(lots, 100, {
      sortField: 'received_date',
      sortDirection: 'asc'
    });
    expect(result.fulfilledQty).toBe(30);
    expect(result.shortfallQty).toBe(70);
  });

  test('lots missing the configured sort field sort last', () => {
    const withMissingExpiry: AllocatableLot[] = [
      { id: 'X', qty: 5, receivedDate: '2026-01-01', expiryDate: null },
      { id: 'Y', qty: 5, receivedDate: '2026-01-02', expiryDate: '2026-06-01' }
    ];
    const result = allocateLots(withMissingExpiry, 5, {
      sortField: 'expiry_date',
      sortDirection: 'asc'
    });
    expect(result.picks).toEqual([{ lotId: 'Y', qty: 5 }]);
  });

  test('returns no picks for a non-positive request', () => {
    const result = allocateLots(lots, 0, {
      sortField: 'received_date',
      sortDirection: 'asc'
    });
    expect(result.picks).toEqual([]);
  });
});
