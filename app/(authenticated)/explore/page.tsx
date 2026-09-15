import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { findDiscoveryProducts } from "../_lib/discovery-catalog";
import { parseExploreSearchParams } from "../_lib/discovery-search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function ExplorePage({ searchParams }: Props) {
  await requireAuthenticatedUser();
  const categoryId = parseExploreSearchParams(await searchParams);
  const products = await findDiscoveryProducts({ categoryId: categoryId || undefined });

  return <main className="p-8"><h1 className="text-3xl font-semibold">Explorar catálogo</h1><p className="mt-2 text-muted-foreground">{categoryId ? "Productos de la categoría seleccionada." : "Todos los productos disponibles."}</p>{products.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <Card key={product.id}><CardHeader><CardTitle>{product.name}</CardTitle><CardDescription>{product.description ?? "Sin descripción disponible."}</CardDescription></CardHeader></Card>)}</div> : <Empty className="mt-6 border"><EmptyHeader><EmptyTitle>No hay productos para mostrar</EmptyTitle><EmptyDescription>Elegí otra categoría o volvé a intentar más tarde.</EmptyDescription></EmptyHeader></Empty>}</main>;
}
