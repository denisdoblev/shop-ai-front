import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { findDiscoveryProduct } from "../_lib/discovery-catalog";
import { parseCompareSearchParams } from "../_lib/discovery-search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function ComparePage({ searchParams }: Props) {
  await requireAuthenticatedUser();
  const productId = parseCompareSearchParams(await searchParams);
  const product = productId ? await findDiscoveryProduct(productId).catch(() => null) : null;

  return <main className="p-8"><h1 className="text-3xl font-semibold">Comparar productos</h1>{product ? <Card className="mt-6 max-w-xl"><CardHeader><CardTitle>{product.name}</CardTitle><CardDescription>{product.description ?? "Sin descripción disponible."}</CardDescription></CardHeader></Card> : <Empty className="mt-6 border"><EmptyHeader><EmptyTitle>{productId ? "No encontramos ese producto" : "Elegí un producto para comparar"}</EmptyTitle><EmptyDescription>Seleccioná un producto desde Inicio o Explorá el catálogo.</EmptyDescription></EmptyHeader></Empty>}</main>;
}
