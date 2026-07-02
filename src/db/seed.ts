// ============================================================
// Dev seed script
// ============================================================
// Usage: SEED_ORG_ID=org_xxx bun run db:seed
//
// SEED_ORG_ID must be a real Clerk organization id (from the org switcher
// after signing in and creating/selecting an org) — every table is org-scoped,
// so seeded rows are invisible in the app unless they match the org you're
// actually signed into.
// ============================================================
/* eslint-disable no-console -- CLI script; progress output is the point */

import { faker } from '@faker-js/faker';
import { db } from './index';
import { warehouses, zones, locations, docks, employees, productSkus, vehicles } from './schema';

try {
  process.loadEnvFile('.env.local');
} catch {
  // rely on process.env being set another way
}

const orgId = process.env.SEED_ORG_ID;
if (!orgId) {
  throw new Error(
    'SEED_ORG_ID is not set. Sign in, create/select a Clerk organization, copy its org_... id ' +
      'from the org switcher, then run: SEED_ORG_ID=org_xxx bun run db:seed'
  );
}

const WAREHOUSE_SEEDS = [
  { code: 'WH-HN', name: 'Hanoi Distribution Center', city: 'Hanoi', lat: 21.0278, lng: 105.8342 },
  {
    code: 'WH-HCM',
    name: 'Ho Chi Minh Fulfillment Center',
    city: 'Ho Chi Minh City',
    lat: 10.8231,
    lng: 106.6297
  },
  {
    code: 'WH-DN',
    name: 'Da Nang Regional Warehouse',
    city: 'Da Nang',
    lat: 16.0544,
    lng: 108.2022
  }
];

const EMPLOYEE_ROLES = [
  'Picker',
  'Putaway Operator',
  'Forklift Operator',
  'Dock Supervisor',
  'Inventory Clerk',
  'Warehouse Manager',
  'HR Coordinator'
];

const PRODUCT_PRESETS: Array<{
  storageClassLabel: string;
  allocationSortField: 'received_date' | 'expiry_date';
  allocationSortDirection: 'asc' | 'desc';
  category: string;
}> = [
  {
    storageClassLabel: 'FIFO',
    allocationSortField: 'received_date',
    allocationSortDirection: 'asc',
    category: 'Dry Goods'
  },
  {
    storageClassLabel: 'FEFO',
    allocationSortField: 'expiry_date',
    allocationSortDirection: 'asc',
    category: 'Perishables'
  },
  {
    storageClassLabel: 'LEFO',
    allocationSortField: 'expiry_date',
    allocationSortDirection: 'desc',
    category: 'Bulk Non-Perishables'
  },
  {
    storageClassLabel: 'Custom',
    allocationSortField: 'received_date',
    allocationSortDirection: 'desc',
    category: 'Promotional'
  }
];

async function seed(orgId: string) {
  console.log(`Seeding org ${orgId}...`);

  for (const wh of WAREHOUSE_SEEDS) {
    const [warehouse] = await db
      .insert(warehouses)
      .values({
        orgId,
        name: wh.name,
        code: wh.code,
        address: `${wh.city}, Vietnam`,
        lat: wh.lat,
        lng: wh.lng
      })
      .returning();

    console.log(`  Warehouse ${warehouse.code} (${warehouse.id})`);

    const zoneRows = await db
      .insert(zones)
      .values([
        { orgId, warehouseId: warehouse.id, name: 'Fast Pick', code: 'A' },
        { orgId, warehouseId: warehouse.id, name: 'Bulk Storage', code: 'B' }
      ])
      .returning();

    // 10-30 dock doors per warehouse, mixed direction.
    const dockCount = faker.number.int({ min: 10, max: 30 });
    await db.insert(docks).values(
      Array.from({ length: dockCount }, (_, i) => ({
        orgId,
        warehouseId: warehouse.id,
        code: `D${String(i + 1).padStart(2, '0')}`,
        direction: faker.helpers.arrayElement(['inbound', 'outbound', 'both'] as const)
      }))
    );

    // ~40 rack/floor locations per warehouse, closer ones in Fast Pick.
    for (const zone of zoneRows) {
      const isFastPick = zone.code === 'A';
      const locationCount = isFastPick ? 20 : 20;
      await db.insert(locations).values(
        Array.from({ length: locationCount }, (_, i) => ({
          orgId,
          warehouseId: warehouse.id,
          zoneId: zone.id,
          code: `${zone.code}-${String(i + 1).padStart(3, '0')}`,
          type: isFastPick ? ('rack' as const) : ('floor' as const),
          level: isFastPick ? faker.number.int({ min: 1, max: 4 }) : 1,
          capacityVolume: faker.number.float({ min: 5, max: 40, fractionDigits: 1 }),
          capacityWeight: faker.number.float({ min: 200, max: 2000, fractionDigits: 0 }),
          distanceToDock: isFastPick
            ? faker.number.float({ min: 5, max: 40, fractionDigits: 1 })
            : faker.number.float({ min: 40, max: 150, fractionDigits: 1 })
        }))
      );
    }

    // 50-70 employees per warehouse -> a few hundred across 3 warehouses.
    const employeeCount = faker.number.int({ min: 50, max: 70 });
    await db.insert(employees).values(
      Array.from({ length: employeeCount }, () => {
        const isTerminated = faker.datatype.boolean({ probability: 0.1 });
        const hireDate = faker.date.past({ years: 3 });
        return {
          orgId,
          warehouseId: warehouse.id,
          fullName: faker.person.fullName(),
          role: faker.helpers.arrayElement(EMPLOYEE_ROLES),
          department: 'Warehouse Operations',
          hireDate: hireDate.toISOString().slice(0, 10),
          terminationDate: isTerminated
            ? faker.date.between({ from: hireDate, to: new Date() }).toISOString().slice(0, 10)
            : null,
          status: isTerminated ? ('terminated' as const) : ('active' as const)
        };
      })
    );

    // 3-6 vehicles per warehouse.
    const vehicleCount = faker.number.int({ min: 3, max: 6 });
    await db.insert(vehicles).values(
      Array.from({ length: vehicleCount }, () => ({
        orgId,
        homeWarehouseId: warehouse.id,
        plateNumber: faker.vehicle.vrm(),
        type: faker.helpers.arrayElement(['truck', 'van', 'container_truck']),
        capacityWeight: faker.number.float({ min: 1000, max: 15000, fractionDigits: 0 }),
        capacityVolume: faker.number.float({ min: 10, max: 80, fractionDigits: 1 })
      }))
    );
  }

  // SKUs are org-wide (not warehouse-scoped) — stock location is tracked per
  // lot once InventoryLot ships in Phase 1.
  await db.insert(productSkus).values(
    Array.from({ length: 24 }, (_, i) => {
      const preset = PRODUCT_PRESETS[i % PRODUCT_PRESETS.length];
      return {
        orgId,
        sku: `SKU-${String(i + 1).padStart(4, '0')}`,
        name: faker.commerce.productName(),
        category: preset.category,
        unit: faker.helpers.arrayElement(['carton', 'pallet', 'unit']),
        weight: faker.number.float({ min: 0.5, max: 50, fractionDigits: 2 }),
        volume: faker.number.float({ min: 0.01, max: 2, fractionDigits: 3 }),
        storageClassLabel: preset.storageClassLabel,
        allocationSortField: preset.allocationSortField,
        allocationSortDirection: preset.allocationSortDirection
      };
    })
  );

  console.log('Seed complete.');
}

seed(orgId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
