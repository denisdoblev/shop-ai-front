"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { MAX_COMPARE_PRODUCTS } from "../_lib/discovery-search-params";

export type CompareProductSelection = {
  id: string;
  name: string;
};

type CompareContextValue = {
  products: CompareProductSelection[];
  add(product: CompareProductSelection): void;
  remove(productId: string): void;
  toggle(product: CompareProductSelection): void;
  replace(products: CompareProductSelection[]): void;
  clear(): void;
};

const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_PREFIX = "shopai.compare.v1";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const subscribeHydration = () => () => undefined;

function normalizeProducts(
  products: readonly CompareProductSelection[],
): CompareProductSelection[] {
  const seen = new Set<string>();
  const normalized: CompareProductSelection[] = [];

  for (const product of products) {
    const name = product.name.trim();
    if (!UUID_PATTERN.test(product.id) || !name || seen.has(product.id)) continue;
    seen.add(product.id);
    normalized.push({ id: product.id, name: name.slice(0, 200) });
    if (normalized.length === MAX_COMPARE_PRODUCTS) break;
  }

  return normalized;
}

function readStoredProducts(storageKey: string): CompareProductSelection[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(value)) return [];

    return normalizeProducts(
      value.flatMap((item): CompareProductSelection[] => {
        if (
          typeof item !== "object" ||
          item === null ||
          !("id" in item) ||
          !("name" in item) ||
          typeof item.id !== "string" ||
          typeof item.name !== "string"
        ) {
          return [];
        }
        return [{ id: item.id, name: item.name }];
      }),
    );
  } catch {
    return [];
  }
}

export function CompareProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const storageKey = `${STORAGE_PREFIX}:${userId}`;
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [storageVersion, setStorageVersion] = useState(0);

  useEffect(() => {
    if (!hydrated) return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setStorageVersion((current) => current + 1);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [hydrated, storageKey]);

  const storedProducts = useMemo(() => {
    if (!hydrated) return [];
    return readStoredProducts(storageKey);
  }, [hydrated, storageKey, storageVersion]);

  const [selection, setSelection] = useState<{
    storageKey: string;
    products: CompareProductSelection[];
  } | null>(null);
  const products =
    selection?.storageKey === storageKey ? selection.products : storedProducts;
  const setProducts = useCallback(
    (
      update:
        | CompareProductSelection[]
        | ((current: CompareProductSelection[]) => CompareProductSelection[]),
    ) => {
      setSelection((currentSelection) => {
        const current =
          currentSelection?.storageKey === storageKey
            ? currentSelection.products
            : storedProducts;
        return {
          storageKey,
          products: typeof update === "function" ? update(current) : update,
        };
      });
    },
    [storageKey, storedProducts],
  );

  useEffect(() => {
    if (!hydrated || selection?.storageKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(products));
    } catch {
      // Storage can be blocked or full. In-memory comparison remains usable.
    }
  }, [hydrated, products, selection?.storageKey, storageKey]);

  const add = useCallback((product: CompareProductSelection) => {
    setProducts((current) =>
      normalizeProducts(current.some(({ id }) => id === product.id) ? current : [...current, product]),
    );
  }, [setProducts]);
  const remove = useCallback((productId: string) => {
    setProducts((current) => current.filter(({ id }) => id !== productId));
  }, [setProducts]);
  const toggle = useCallback((product: CompareProductSelection) => {
    setProducts((current) =>
      current.some(({ id }) => id === product.id)
        ? current.filter(({ id }) => id !== product.id)
        : normalizeProducts([...current, product]),
    );
  }, [setProducts]);
  const replace = useCallback((nextProducts: CompareProductSelection[]) => {
    setProducts(normalizeProducts(nextProducts));
  }, [setProducts]);
  const clear = useCallback(() => setProducts([]), [setProducts]);
  const value = useMemo(
    () => ({ add, clear, products, remove, replace, toggle }),
    [add, clear, products, remove, replace, toggle],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
}
