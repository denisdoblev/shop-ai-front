import type { ReactNode } from "react";

export type CrudActionResult =
  | { success: true }
  | { message: string; success: false };

export type CrudColumn<TItem> = {
  cell: (item: TItem) => ReactNode;
  className?: string;
  header: string;
  id: string;
};

export type CrudCreateAction = {
  label: string;
  onCreate: () => void;
};

export type CrudSearch = {
  isPending?: boolean;
  maxLength?: number;
  onValueChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export type CrudPagination = {
  hasNext: boolean;
  hasPrevious: boolean;
  isPending?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
};

export type CrudTableProps<TItem> = {
  columns: CrudColumn<TItem>[];
  createAction?: CrudCreateAction;
  deleteDescription: (item: TItem) => string;
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  eyebrow?: string;
  getRowId: (item: TItem) => string;
  getRowLabel: (item: TItem) => string;
  items: TItem[];
  noResultsDescription?: string;
  noResultsTitle?: string;
  onDelete: (item: TItem) => Promise<CrudActionResult>;
  onEdit: (item: TItem) => void;
  pagination?: CrudPagination;
  search?: CrudSearch;
  title: string;
};
