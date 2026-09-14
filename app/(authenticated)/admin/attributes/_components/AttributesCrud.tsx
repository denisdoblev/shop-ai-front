"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CrudTable } from "@/components/CrudTable/CrudTable";
import type {
  CrudColumn,
  CrudTableMessages,
} from "@/components/CrudTable/_types/types";
import { Badge } from "@/components/ui/badge";

import { deleteAttribute } from "../actions";
import type { Attribute, AttributeDataType } from "../_types/Attribute";

const SEARCH_DELAY_MS = 350;

const DATA_TYPE_LABELS: Record<AttributeDataType, string> = {
  boolean: "Sí / No",
  number: "Número",
  string: "Texto",
};

const TABLE_MESSAGES: CrudTableMessages = {
  actions: "Acciones",
  cancel: "Cancelar",
  confirmDelete: "Eliminar",
  delete: "Eliminar",
  deleteDialogTitle: "¿Eliminar este atributo?",
  deleteErrorTitle: "No pudimos eliminar el atributo",
  deleting: "Eliminando…",
  edit: "Editar",
  next: "Siguiente",
  nextPage: "Ir a la página siguiente",
  page: "Página",
  previous: "Anterior",
  previousPage: "Ir a la página anterior",
};

const columns: CrudColumn<Attribute>[] = [
  {
    cell: (attribute) => (
      <span className="font-medium">{attribute.name}</span>
    ),
    header: "Nombre",
    id: "name",
  },
  {
    cell: (attribute) => (
      <span className="font-mono text-sm text-muted-foreground">
        {attribute.slug}
      </span>
    ),
    header: "Slug",
    id: "slug",
  },
  {
    cell: (attribute) => (
      <Badge variant="secondary">
        {DATA_TYPE_LABELS[attribute.dataType]}
      </Badge>
    ),
    header: "Tipo",
    id: "data-type",
  },
  {
    cell: (attribute) =>
      attribute.unit ? (
        <span>{attribute.unit}</span>
      ) : (
        <span className="text-muted-foreground">Sin unidad</span>
      ),
    header: "Unidad",
    id: "unit",
  },
];

type AttributesCrudProps = {
  attributes: Attribute[];
  hasNext: boolean;
  name: string;
  page: number;
};

function getAttributesUrl(name: string, page: number): string {
  const searchParams = new URLSearchParams();
  const normalizedName = name.trim();

  if (normalizedName) searchParams.set("name", normalizedName);
  if (page > 1) searchParams.set("page", String(page));

  const query = searchParams.toString();
  return query ? `/admin/attributes?${query}` : "/admin/attributes";
}

export function AttributesCrud({
  attributes,
  hasNext,
  name,
  page,
}: AttributesCrudProps) {
  const router = useRouter();
  const [searchState, setSearchState] = useState({
    editVersion: 0,
    value: name,
  });
  const [urlSyncState, setUrlSyncState] = useState<{
    name: string;
    pendingSearches: Array<{ editVersion: number; name: string }>;
  }>({ name, pendingSearches: [] });
  const [isNavigating, startNavigationTransition] = useTransition();
  const searchValue = searchState.value;

  if (name !== urlSyncState.name) {
    const pendingSearchIndex = urlSyncState.pendingSearches.findIndex(
      (search) => search.name === name,
    );
    const completedSearch =
      pendingSearchIndex >= 0
        ? urlSyncState.pendingSearches[pendingSearchIndex]
        : undefined;

    setUrlSyncState({
      name,
      pendingSearches: urlSyncState.pendingSearches.filter(
        (_, index) => index !== pendingSearchIndex,
      ),
    });
    if (
      !completedSearch ||
      completedSearch.editVersion === searchState.editVersion
    ) {
      setSearchState((current) => ({ ...current, value: name }));
    }
  }

  useEffect(() => {
    const normalizedSearch = searchValue.trim();
    if (normalizedSearch === name) return;

    const timeoutId = window.setTimeout(() => {
      setUrlSyncState((current) => ({
        ...current,
        pendingSearches: [
          ...current.pendingSearches,
          { editVersion: searchState.editVersion, name: normalizedSearch },
        ],
      }));
      startNavigationTransition(() => {
        router.replace(getAttributesUrl(normalizedSearch, 1), {
          scroll: false,
        });
      });
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [name, router, searchState.editVersion, searchValue]);

  return (
    <CrudTable
      columns={columns}
      createAction={{
        label: "Añadir atributo",
        onCreate: () => router.push("/admin/attributes/new"),
      }}
      deleteDescription={(attribute) =>
        `Se retirará ${attribute.name} del catálogo activo. No se puede eliminar mientras tenga categorías o especificaciones de producto asociadas.`
      }
      description="Define los campos reutilizables que describen y comparan los productos."
      emptyDescription="Añade el primer atributo para empezar a estructurar las fichas del catálogo."
      emptyTitle="Todavía no hay atributos"
      eyebrow="Administración / Atributos"
      getRowId={(attribute) => attribute.id}
      getRowLabel={(attribute) => attribute.name}
      items={attributes}
      messages={TABLE_MESSAGES}
      noResultsDescription="Prueba con otro nombre de atributo o limpia la búsqueda."
      noResultsTitle="No encontramos atributos"
      onDelete={async (attribute) => {
        const result = await deleteAttribute(attribute.id);

        if (result.success && attributes.length === 1 && page > 1) {
          router.replace(getAttributesUrl(name, page - 1), { scroll: false });
        }

        return result;
      }}
      onEdit={(attribute) =>
        router.push(`/admin/attributes/${attribute.id}/edit`)
      }
      pagination={{
        hasNext,
        hasPrevious: page > 1,
        isPending: isNavigating,
        onNext: () => {
          startNavigationTransition(() => {
            router.push(getAttributesUrl(name, page + 1), { scroll: false });
          });
        },
        onPrevious: () => {
          startNavigationTransition(() => {
            router.push(getAttributesUrl(name, page - 1), { scroll: false });
          });
        },
        page,
      }}
      search={{
        isPending: isNavigating,
        maxLength: 100,
        onValueChange: (value) => {
          setSearchState((current) => ({
            editVersion: current.editVersion + 1,
            value,
          }));
        },
        placeholder: "Buscar atributos",
        value: searchValue,
      }}
      title="Atributos"
    />
  );
}
