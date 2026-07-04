/* eslint-disable no-console */

import { faker } from '@faker-js/faker';
import { db } from './index';
import {
  deliveryOrders,
  docks,
  dockSchedules,
  employees,
  fuelPrices,
  inventoryLots,
  inventoryTransactions,
  kpiTemplates,
  locations,
  notifications,
  productSkus,
  slottingRuns,
  staffingPlans,
  taskLogs,
  vehicles,
  warehouses,
  workflowTasks,
  workTasks,
  zones
} from './schema';

try {
  process.loadEnvFile('.env.local');
} catch {}

const orgId = process.env.SEED_ORG_ID;
if (!orgId) {
  throw new Error('SEED_ORG_ID is not set. Run: SEED_ORG_ID=org_xxx bun run db:seed');
}

const warehouseSeeds = [
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

const workflowSeed = [
  {
    name: 'Nhan xe vao dock',
    estimatedMinutes: 20,
    requiredRole: 'Dock Supervisor',
    outputUnit: 'trip',
    standardRatePerHour: 3,
    kpiCategory: 'dock'
  },
  {
    name: 'Putaway pallet',
    estimatedMinutes: 35,
    requiredRole: 'Forklift Operator',
    outputUnit: 'pallet',
    standardRatePerHour: 14,
    kpiCategory: 'throughput'
  },
  {
    name: 'Pick hang theo don',
    estimatedMinutes: 25,
    requiredRole: 'Picker',
    outputUnit: 'line',
    standardRatePerHour: 22,
    kpiCategory: 'picking'
  },
  {
    name: 'Kiem dem va dong goi',
    estimatedMinutes: 18,
    requiredRole: 'Inventory Clerk',
    outputUnit: 'order',
    standardRatePerHour: 10,
    kpiCategory: 'accuracy'
  },
  {
    name: 'Ban giao xuat xe',
    estimatedMinutes: 15,
    requiredRole: 'Dock Supervisor',
    outputUnit: 'trip',
    standardRatePerHour: 4,
    kpiCategory: 'dispatch'
  }
];

const employeeRoles = [
  'Picker',
  'Putaway Operator',
  'Forklift Operator',
  'Dock Supervisor',
  'Inventory Clerk',
  'Warehouse Manager',
  'HR Coordinator'
] as const;

const productPresets: Array<{
  sku: string;
  name: string;
  unit: string;
  weight: number;
  storageClassLabel: string;
  allocationSortField: 'received_date' | 'expiry_date';
  allocationSortDirection: 'asc' | 'desc';
}> = [
  {
    sku: 'SKU-MILK',
    name: 'Sua hop 1L',
    unit: 'carton',
    weight: 12,
    storageClassLabel: 'FEFO',
    allocationSortField: 'expiry_date',
    allocationSortDirection: 'asc'
  },
  {
    sku: 'SKU-RICE',
    name: 'Gao 25kg',
    unit: 'bag',
    weight: 25,
    storageClassLabel: 'FIFO',
    allocationSortField: 'received_date',
    allocationSortDirection: 'asc'
  },
  {
    sku: 'SKU-PAPER',
    name: 'Giay tissue carton',
    unit: 'carton',
    weight: 8,
    storageClassLabel: 'LEFO',
    allocationSortField: 'expiry_date',
    allocationSortDirection: 'desc'
  },
  {
    sku: 'SKU-PROMO',
    name: 'Bo qua tang promo',
    unit: 'set',
    weight: 4,
    storageClassLabel: 'Custom',
    allocationSortField: 'received_date',
    allocationSortDirection: 'desc'
  }
];

async function seed(orgId: string) {
  console.log(`Seeding org ${orgId}...`);

  const seededWarehouses: Array<typeof warehouses.$inferSelect> = [];
  const allLocations: Array<typeof locations.$inferSelect> = [];
  const allEmployees: Array<typeof employees.$inferSelect> = [];
  const allDocks: Array<typeof docks.$inferSelect> = [];

  for (const warehouseSeed of warehouseSeeds) {
    const [warehouse] = await db
      .insert(warehouses)
      .values({
        orgId,
        name: warehouseSeed.name,
        code: warehouseSeed.code,
        address: `${warehouseSeed.city}, Vietnam`,
        lat: warehouseSeed.lat,
        lng: warehouseSeed.lng
      })
      .returning();
    seededWarehouses.push(warehouse);

    const zoneRows = await db
      .insert(zones)
      .values([
        { orgId, warehouseId: warehouse.id, name: 'Fast Pick', code: 'A' },
        { orgId, warehouseId: warehouse.id, name: 'Bulk Storage', code: 'B' },
        { orgId, warehouseId: warehouse.id, name: 'Returns', code: 'R' }
      ])
      .returning();

    const dockRows = await db
      .insert(docks)
      .values(
        Array.from({ length: 8 }, (_, index) => ({
          orgId,
          warehouseId: warehouse.id,
          code: `D${String(index + 1).padStart(2, '0')}`,
          direction: (index < 3 ? 'inbound' : index < 6 ? 'outbound' : 'both') as
            | 'inbound'
            | 'outbound'
            | 'both'
        }))
      )
      .returning();
    allDocks.push(...dockRows);

    for (const zone of zoneRows) {
      const locationRows = await db
        .insert(locations)
        .values(
          Array.from({ length: zone.code === 'A' ? 16 : 10 }, (_, index) => ({
            orgId,
            warehouseId: warehouse.id,
            zoneId: zone.id,
            code: `${zone.code}-${String(index + 1).padStart(3, '0')}`,
            type: (zone.code === 'B' ? 'floor' : 'rack') as 'floor' | 'rack',
            level: zone.code === 'B' ? 1 : (index % 4) + 1,
            capacityVolume: zone.code === 'B' ? 80 : 25,
            capacityWeight: zone.code === 'B' ? 2500 : 900,
            distanceToDock:
              zone.code === 'A' ? 8 + index : zone.code === 'B' ? 40 + index * 4 : 18 + index * 2
          }))
        )
        .returning();
      allLocations.push(...locationRows);
    }

    const employeeRows = await db
      .insert(employees)
      .values(
        Array.from({ length: 28 }, (_, index) => {
          const role = employeeRoles[index % employeeRoles.length];
          const hireDate = faker.date.past({ years: 3 });
          const status =
            index % 12 === 0
              ? ('terminated' as const)
              : index % 9 === 0
                ? ('on_leave' as const)
                : ('active' as const);
          return {
            orgId,
            warehouseId: warehouse.id,
            fullName: faker.person.fullName(),
            role,
            department: role === 'HR Coordinator' ? 'People Ops' : 'Warehouse Operations',
            hireDate: hireDate.toISOString().slice(0, 10),
            terminationDate:
              status === 'terminated'
                ? faker.date.between({ from: hireDate, to: new Date() }).toISOString().slice(0, 10)
                : null,
            status
          };
        })
      )
      .returning();
    allEmployees.push(...employeeRows);

    await db.insert(vehicles).values(
      Array.from({ length: 5 }, () => ({
        orgId,
        homeWarehouseId: warehouse.id,
        plateNumber: faker.vehicle.vrm(),
        type: faker.helpers.arrayElement(['truck', 'van', 'container_truck']),
        capacityWeight: faker.number.float({ min: 1200, max: 12000, fractionDigits: 0 }),
        capacityVolume: faker.number.float({ min: 12, max: 70, fractionDigits: 1 })
      }))
    );
  }

  const skuRows = await db
    .insert(productSkus)
    .values(
      productPresets.map((preset, index) => ({
        orgId,
        sku: preset.sku,
        name: preset.name,
        category: index % 2 === 0 ? 'Food' : 'General',
        unit: preset.unit,
        weight: preset.weight,
        volume: index % 2 === 0 ? 0.8 : 0.4,
        storageClassLabel: preset.storageClassLabel,
        allocationSortField: preset.allocationSortField,
        allocationSortDirection: preset.allocationSortDirection
      }))
    )
    .returning();

  const workflowRows = await db
    .insert(workflowTasks)
    .values(
      workflowSeed.map((task, index) => ({
        orgId,
        ...task,
        sortOrder: index
      }))
    )
    .returning();

  const [staffingPlan] = await db
    .insert(staffingPlans)
    .values({
      orgId,
      warehouseId: seededWarehouses[0].id,
      name: 'Ca sang inbound HN',
      availableHeadcount: 9,
      status: 'active',
      criticalPathHours: 4.5
    })
    .returning();

  await db.insert(workTasks).values([
    {
      orgId,
      planId: staffingPlan.id,
      name: 'Nhan xe vao dock',
      durationHours: 0.5,
      predecessorIds: [],
      requiredHeadcount: 2,
      assignedEmployeeIds: allEmployees
        .filter((employee) => employee.warehouseId === staffingPlan.warehouseId)
        .slice(0, 2)
        .map((employee) => employee.id),
      earlyStart: 0,
      earlyFinish: 0.5,
      lateStart: 0,
      lateFinish: 0.5,
      totalFloat: 0,
      isCritical: 1,
      color: '#3b82f6'
    },
    {
      orgId,
      planId: staffingPlan.id,
      name: 'Putaway pallet',
      durationHours: 2,
      predecessorIds: [],
      requiredHeadcount: 3,
      assignedEmployeeIds: allEmployees
        .filter((employee) => employee.role === 'Forklift Operator')
        .slice(0, 3)
        .map((employee) => employee.id),
      earlyStart: 0.5,
      earlyFinish: 2.5,
      lateStart: 0.5,
      lateFinish: 2.5,
      totalFloat: 0,
      isCritical: 1,
      color: '#10b981'
    },
    {
      orgId,
      planId: staffingPlan.id,
      name: 'Pick hang theo don',
      durationHours: 1.5,
      predecessorIds: [],
      requiredHeadcount: 3,
      assignedEmployeeIds: allEmployees
        .filter((employee) => employee.role === 'Picker')
        .slice(0, 3)
        .map((employee) => employee.id),
      earlyStart: 2.5,
      earlyFinish: 4,
      lateStart: 2.5,
      lateFinish: 4,
      totalFloat: 0,
      isCritical: 1,
      color: '#f59e0b'
    }
  ]);

  const kpiRows = [
    {
      orgId,
      role: 'warehouse_manager',
      kpiName: 'Su dung nhan luc',
      formula: 'Nhu cau dinh bien / nhan su san sang * 100',
      target: 85,
      unit: '%',
      weight: 0.2
    },
    {
      orgId,
      role: 'team_lead',
      kpiName: 'Bam duong gang',
      formula: 'Thoi gian thuc te / ke hoach * 100',
      target: 105,
      unit: '%',
      weight: 0.3
    }
  ];
  await db.insert(kpiTemplates).values(kpiRows);

  const primaryWarehouse = seededWarehouses[0];
  const secondaryWarehouse = seededWarehouses[1];

  for (const warehouse of seededWarehouses) {
    const warehouseLocations = allLocations.filter(
      (location) => location.warehouseId === warehouse.id
    );
    const nearDockLocation = warehouseLocations[0];
    const farLocation = warehouseLocations[warehouseLocations.length - 1];
    const warehouseEmployees = allEmployees.filter(
      (employee) => employee.warehouseId === warehouse.id && employee.status === 'active'
    );

    for (const sku of skuRows) {
      const lots = await db
        .insert(inventoryLots)
        .values([
          {
            orgId,
            skuId: sku.id,
            warehouseId: warehouse.id,
            locationId: farLocation.id,
            lotNo: `${sku.sku}-${warehouse.code}-A`,
            qty: 32,
            receivedDate: '2026-06-20',
            expiryDate: sku.allocationSortField === 'expiry_date' ? '2026-08-15' : null,
            status: 'available'
          },
          {
            orgId,
            skuId: sku.id,
            warehouseId: warehouse.id,
            locationId: nearDockLocation.id,
            lotNo: `${sku.sku}-${warehouse.code}-B`,
            qty: 18,
            receivedDate: '2026-06-28',
            expiryDate: sku.allocationSortField === 'expiry_date' ? '2026-10-30' : null,
            status: 'available'
          }
        ])
        .returning();

      await db.insert(inventoryTransactions).values([
        {
          orgId,
          warehouseId: warehouse.id,
          type: 'inbound',
          skuId: sku.id,
          lotId: lots[0].id,
          qty: lots[0].qty,
          toLocationId: lots[0].locationId,
          performedBy: warehouseEmployees[0]?.id ?? null,
          note: 'Seed inbound lot A'
        },
        {
          orgId,
          warehouseId: warehouse.id,
          type: 'inbound',
          skuId: sku.id,
          lotId: lots[1].id,
          qty: lots[1].qty,
          toLocationId: lots[1].locationId,
          performedBy: warehouseEmployees[1]?.id ?? null,
          note: 'Seed inbound lot B'
        }
      ]);
    }

    await db.insert(taskLogs).values(
      workflowRows.flatMap((task, index) =>
        warehouseEmployees.slice(0, 4).map((employee, employeeIndex) => ({
          orgId,
          warehouseId: warehouse.id,
          employeeId: employee.id,
          taskTypeId: task.id,
          startedAt: new Date(Date.UTC(2026, 6, Math.min(employeeIndex + 1, 4), 8, 0, 0)),
          completedAt: new Date(Date.UTC(2026, 6, Math.min(employeeIndex + 1, 4), 9 + index, 0, 0)),
          qty: 8 + index * 3 + employeeIndex,
          unit: task.outputUnit,
          note: `Seed log ${task.name}`
        }))
      )
    );

    await db.insert(dockSchedules).values({
      orgId,
      warehouseId: warehouse.id,
      scheduleDate: '2026-07-04',
      forkliftsCount: 2,
      minutesPerPallet: 6,
      inputJson: [
        {
          plateNumber: `${warehouse.code}-001`,
          arrivalTime: '08:00',
          palletCount: 24,
          direction: 'inbound'
        },
        {
          plateNumber: `${warehouse.code}-002`,
          arrivalTime: '08:10',
          palletCount: 18,
          direction: 'inbound'
        },
        {
          plateNumber: `${warehouse.code}-003`,
          arrivalTime: '08:20',
          palletCount: 22,
          direction: 'outbound'
        }
      ],
      resultJson: {
        assignments: [],
        avgWaitMinutes: 18,
        totalCompletionMinutes: 140,
        utilizationByDock: { D01: 92, D02: 81 },
        overloadWarnings: [`Xe ${warehouse.code}-002 doi 32 phut`]
      }
    });

    await db.insert(slottingRuns).values({
      orgId,
      warehouseId: warehouse.id,
      movedCount: 2,
      recommendations: [
        {
          lotId: `${warehouse.code}-seed-lot-1`,
          fromLocationId: farLocation.id,
          toLocationId: nearDockLocation.id,
          reason: 'Lot can dua gan dock theo quy tac FEFO'
        }
      ]
    });
  }

  await db.insert(fuelPrices).values([
    {
      orgId: null,
      fuelType: 'DIESEL' as never,
      pricePerLiter: '21850',
      effectiveDate: '2026-07-04',
      source: 'seed'
    },
    {
      orgId: null,
      fuelType: 'RON95' as never,
      pricePerLiter: '22900',
      effectiveDate: '2026-07-04',
      source: 'seed'
    }
  ]);

  await db.insert(deliveryOrders).values([
    {
      orgId,
      warehouseId: primaryWarehouse.id,
      destination: 'Bac Ninh',
      destinationLat: 21.1861,
      destinationLng: 106.0763,
      requiredSkus: [{ skuId: skuRows[0].id, qty: 12 }],
      preferredDate: '2026-07-05',
      status: 'pending'
    },
    {
      orgId,
      warehouseId: secondaryWarehouse.id,
      destination: 'Can Tho',
      destinationLat: 10.0452,
      destinationLng: 105.7469,
      requiredSkus: [{ skuId: skuRows[1].id, qty: 70 }],
      preferredDate: '2026-07-05',
      status: 'planned'
    }
  ]);

  await db.insert(notifications).values([
    {
      orgId,
      warehouseId: primaryWarehouse.id,
      sourceType: 'reslotting',
      title: 'Co de xuat dao vi tri luu tru moi',
      body: 'He thong vua tao de xuat sap xep lai lot FEFO tai kho HN.'
    },
    {
      orgId,
      warehouseId: null,
      sourceType: 'fuel_price',
      title: 'Gia nhien lieu da duoc cap nhat',
      body: 'Bang gia dau diesel va RON95 da san sang cho route planning.'
    }
  ]);

  console.log('Seed complete.');
}

seed(orgId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
