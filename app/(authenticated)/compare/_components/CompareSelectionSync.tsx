"use client";

import { useEffect } from "react";

import { useCompare } from "../../_providers/CompareProvider";

export function CompareSelectionSync({
  products,
  shouldReplaceSelection,
}: {
  products: Array<{ id: string; name: string }>;
  shouldReplaceSelection: boolean;
}) {
  const { replace } = useCompare();

  useEffect(() => {
    if (!shouldReplaceSelection) return;
    replace(products);
  }, [products, replace, shouldReplaceSelection]);

  return null;
}
