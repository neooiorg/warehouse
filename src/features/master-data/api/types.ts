export type WarehouseOption = {
  id: string;
  code: string;
  name: string;
};

export type LocationOption = {
  id: string;
  code: string;
  type: 'floor' | 'rack';
};

export type ProductSkuOption = {
  id: string;
  sku: string;
  name: string;
  allocationSortField: 'received_date' | 'expiry_date';
  allocationSortDirection: 'asc' | 'desc';
};

export type EmployeeOption = {
  id: string;
  fullName: string;
  role: string | null;
};
