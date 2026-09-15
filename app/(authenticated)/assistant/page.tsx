import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { findDiscoveryProducts } from "../_lib/discovery-catalog";
import { parseAssistantSearchParams } from "../_lib/discovery-search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function AssistantPage({ searchParams }: Props) {
  await requireAuthenticatedUser();
  const query = parseAssistantSearchParams(await searchParams);
  const products = query ? await findDiscoveryProducts({ query }) : [];

  return <main className="p-8"><h1 className="text-3xl font-semibold">Asistente de compra</h1><p className="mt-2 text-muted-foreground">{query ? `Resultados para “${query}”` : "Escribí una búsqueda desde Inicio para recibir recomendaciones."}</p>{query ? products.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <Card key={product.id}><CardHeader><CardTitle>{product.name}</CardTitle><CardDescription>{product.description ?? "Sin descripción disponible."}</CardDescription></CardHeader></Card>)}</div> : <Empty className="mt-6 border"><EmptyHeader><EmptyTitle>No encontramos productos</EmptyTitle><EmptyDescription>Probá con una búsqueda más amplia.</EmptyDescription></EmptyHeader></Empty> : null}</main>;
}
