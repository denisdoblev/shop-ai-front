import { PackageOpen, SearchX, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

import { RemoteProductImage } from "../_components/RemoteProductImage";
import { buildExploreHref, parseExploreSearchParams } from "../_lib/discovery-search-params";
import { CompareProductButton } from "./_components/CompareProductButton";
import { ExploreFilters } from "./_components/ExploreFilters";
import { ExploreSearchToolbar } from "./_components/ExploreSearchToolbar";
import { FavoriteButton } from "./_components/FavoriteButton";
import { loadFavorites, searchProducts } from "./_lib/explore-search";
import type { ExploreSearchFilters, ProductSearchItem, ProductSearchResponse } from "./_types/Explore";

export const metadata: Metadata = {
  title: "Explorar catálogo",
  description: "Buscá, filtrá, guardá y compará productos reales de ShopAI.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function formatPrice(product: ProductSearchItem): string {
  if (!product.price) return "Precio no disponible";
  try {
    return new Intl.NumberFormat("es-AR", { currency: product.price.currency, style: "currency" }).format(product.price.price);
  } catch {
    return `${product.price.price} ${product.price.currency}`;
  }
}

function hasFilters(filters: ExploreSearchFilters): boolean {
  return Boolean(filters.q || filters.categoryIds.length || filters.priceRanges.length || filters.featureIds.length);
}

function ProductCard({ favorite, favoritesAvailable, product }: { favorite: boolean; favoritesAvailable: boolean; product: ProductSearchItem }) {
  return (
    <Card className="h-full transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <RemoteProductImage alt={product.image?.altText || product.name} src={product.image?.url ?? null} />
      </div>
      <CardHeader>
        <div><Badge variant="outline">{product.brand.name}</Badge></div>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>{product.model || product.category.name}</CardDescription>
        <CardAction>
          <FavoriteButton available={favoritesAvailable} initialFavorite={favorite} productId={product.id} productName={product.name} />
        </CardAction>
      </CardHeader>
      <CardContent className="mt-auto"><p className="font-heading text-xl font-semibold">{formatPrice(product)}</p></CardContent>
      <CardFooter><CompareProductButton productId={product.id} productName={product.name} /></CardFooter>
    </Card>
  );
}

function SearchFailure() {
  return (
    <Empty className="min-h-96 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon"><TriangleAlert /></EmptyMedia>
        <EmptyTitle>No pudimos buscar en el catálogo</EmptyTitle>
        <EmptyDescription>El catálogo no respondió. Probá nuevamente en unos instantes.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button nativeButton={false} render={<Link href="/explore" />}>Reintentar</Button></EmptyContent>
    </Empty>
  );
}

function ResultEmpty({ filtered }: { filtered: boolean }) {
  return (
    <Empty className="min-h-80 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">{filtered ? <SearchX /> : <PackageOpen />}</EmptyMedia>
        <EmptyTitle>{filtered ? "No encontramos coincidencias" : "El catálogo todavía está vacío"}</EmptyTitle>
        <EmptyDescription>{filtered ? "Probá con otra búsqueda o quitá algunos filtros." : "Los productos aparecerán acá cuando el catálogo tenga contenido."}</EmptyDescription>
      </EmptyHeader>
      {filtered ? <EmptyContent><Button nativeButton={false} render={<Link href="/explore" />} variant="outline">Limpiar filtros</Button></EmptyContent> : null}
    </Empty>
  );
}

function CategoryShortcuts({ filters, result }: { filters: ExploreSearchFilters; result: ProductSearchResponse }) {
  return (
    <nav aria-label="Categorías rápidas" className="flex gap-2 overflow-x-auto pb-1">
      <Button nativeButton={false} render={<Link href={buildExploreHref({ ...filters, categoryIds: [], offset: 0 })} />} size="sm" variant={filters.categoryIds.length === 0 ? "secondary" : "outline"}>Todo</Button>
      {result.facets.categories.slice(0, 8).map((category) => {
        const selected = filters.categoryIds.includes(category.id);
        return (
          <Button key={category.id} nativeButton={false} render={<Link href={buildExploreHref({ ...filters, categoryIds: selected ? [] : [category.id], offset: 0 })} />} size="sm" variant={selected ? "secondary" : "outline"}>
            {category.name}
          </Button>
        );
      })}
    </nav>
  );
}

export default async function ExplorePage({ searchParams }: Props) {
  const [, rawSearchParams] = await Promise.all([requireAuthenticatedUser(), searchParams]);
  const filters = parseExploreSearchParams(rawSearchParams);
  const [searchResult, favoritesResult] = await Promise.allSettled([searchProducts(filters), loadFavorites()]);

  if (searchResult.status === "rejected") {
    return (
      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-2"><Badge variant="outline">Catálogo real</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Encontrá tu próxima compra</h1></header>
        <SearchFailure />
      </main>
    );
  }

  const result = searchResult.value;
  const favoritesAvailable = favoritesResult.status === "fulfilled";
  const favoriteIds = new Set(favoritesResult.status === "fulfilled" ? favoritesResult.value.map(({ productId }) => productId) : []);
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(result.pagination.total / filters.limit));
  const hasPreviousPage = filters.offset > 0;
  const hasNextPage = filters.offset + filters.limit < result.pagination.total;
  const previousHref = hasPreviousPage
    ? buildExploreHref({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })
    : undefined;
  const nextHref = hasNextPage
    ? buildExploreHref({ ...filters, offset: filters.offset + filters.limit })
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 pb-36 sm:px-6 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-3">
        <Badge className="self-start" variant="outline">Catálogo real</Badge>
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">Encontrá tu próxima compra</h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">Filtrá el catálogo, guardá favoritos y armá una comparación con datos reales.</p>
        </div>
      </header>

      <ExploreSearchToolbar filters={filters} />
      <CategoryShortcuts filters={filters} result={result} />

      {!favoritesAvailable ? (
        <Alert><TriangleAlert /><AlertTitle>Favoritos temporalmente no disponibles</AlertTitle><AlertDescription>Podés seguir buscando y comparando productos. Los corazones quedan deshabilitados por ahora.</AlertDescription></Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ExploreFilters facets={result.facets} filters={filters} />
        <section aria-labelledby="search-results-title" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="search-results-title" className="text-xl font-semibold">Resultados</h2><p className="text-sm text-muted-foreground">{result.pagination.total === 1 ? "1 producto encontrado" : `${result.pagination.total} productos encontrados`}</p></div>
          </div>

          {result.items.length === 0 ? <ResultEmpty filtered={hasFilters(filters) || filters.offset > 0} /> : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((product) => <ProductCard key={product.id} favorite={favoriteIds.has(product.id)} favoritesAvailable={favoritesAvailable} product={product} />)}
            </div>
          )}

          {hasPreviousPage || hasNextPage ? (
            <Pagination><PaginationContent>
              <PaginationItem><PaginationPrevious aria-disabled={!hasPreviousPage} className={cn(!hasPreviousPage && "pointer-events-none opacity-50")} href={previousHref} tabIndex={hasPreviousPage ? undefined : -1} text="Anterior" /></PaginationItem>
              <PaginationItem><span className="px-3 text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span></PaginationItem>
              <PaginationItem><PaginationNext aria-disabled={!hasNextPage} className={cn(!hasNextPage && "pointer-events-none opacity-50")} href={nextHref} tabIndex={hasNextPage ? undefined : -1} text="Siguiente" /></PaginationItem>
            </PaginationContent></Pagination>
          ) : null}
        </section>
      </div>
    </main>
  );
}
