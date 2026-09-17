export type CompareProduct = {
  brandName: string;
  categoryName: string;
  currency: string | null;
  id: string;
  imageUrl: string | null;
  model: string | null;
  name: string;
  price: number | null;
};

export type CompareAttributeRow = {
  attributeId: string;
  label: string;
  values: Record<string, string>;
};

export type CompareResult = {
  attributeRows: CompareAttributeRow[];
  hasPartialFailure: boolean;
  missingProductCount: number;
  products: CompareProduct[];
};
