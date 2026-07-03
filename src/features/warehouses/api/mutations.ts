'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createZone,
  updateZone,
  deleteZone,
  createLocation,
  updateLocation,
  deleteLocation,
  createDock,
  updateDock,
  deleteDock
} from './service';
import { warehouseKeys } from './queries';

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success('Tạo kho thành công');
    },
    onError: () => toast.error('Không thể tạo kho')
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateWarehouse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success('Cập nhật kho thành công');
    },
    onError: () => toast.error('Không thể cập nhật kho')
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success('Đã xóa kho');
    },
    onError: () => toast.error('Không thể xóa kho')
  });
}

export function useCreateZone(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.zones(warehouseId) });
      toast.success('Tạo khu vực thành công');
    },
    onError: () => toast.error('Không thể tạo khu vực')
  });
}

export function useUpdateZone(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.zones(warehouseId) });
      toast.success('Cập nhật khu vực thành công');
    },
    onError: () => toast.error('Không thể cập nhật khu vực')
  });
}

export function useDeleteZone(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.zones(warehouseId) });
      toast.success('Đã xóa khu vực');
    },
    onError: () => toast.error('Không thể xóa khu vực')
  });
}

export function useCreateLocation(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.locations(warehouseId) });
      toast.success('Tạo vị trí thành công');
    },
    onError: () => toast.error('Không thể tạo vị trí')
  });
}

export function useUpdateLocation(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.locations(warehouseId) });
      toast.success('Cập nhật vị trí thành công');
    },
    onError: () => toast.error('Không thể cập nhật vị trí')
  });
}

export function useDeleteLocation(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.locations(warehouseId) });
      toast.success('Đã xóa vị trí');
    },
    onError: () => toast.error('Không thể xóa vị trí')
  });
}

export function useCreateDock(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.docks(warehouseId) });
      toast.success('Tạo cửa dock thành công');
    },
    onError: () => toast.error('Không thể tạo cửa dock')
  });
}

export function useUpdateDock(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateDock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.docks(warehouseId) });
      toast.success('Cập nhật cửa dock thành công');
    },
    onError: () => toast.error('Không thể cập nhật cửa dock')
  });
}

export function useDeleteDock(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.docks(warehouseId) });
      toast.success('Đã xóa cửa dock');
    },
    onError: () => toast.error('Không thể xóa cửa dock')
  });
}
