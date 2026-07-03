import { listWarehouses } from '@/features/warehouses/api/service';
import { listDocks as listDocksService } from '@/features/productivity/api/service';
import DockSchedulerClient from './dock-scheduler-client';

export default async function DockSchedulingWrapper() {
  const { data: warehouses } = await listWarehouses({ page: 1, limit: 100 });
  const firstWarehouse = warehouses[0];
  if (!firstWarehouse) {
    return (
      <div className='rounded-lg border p-12 text-center text-sm text-muted-foreground'>
        Chưa có kho nào. Hãy tạo kho trước tại trang Quản lý kho.
      </div>
    );
  }

  const docks = await listDocksService(firstWarehouse.id);

  return (
    <DockSchedulerClient
      warehouseId={firstWarehouse.id}
      warehouseName={firstWarehouse.name}
      docks={docks.map((d) => ({ id: d.id, name: d.code }))}
    />
  );
}
