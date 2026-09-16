import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { findDiscoveryProduct } from "../_lib/discovery-catalog";
import { parseCompareSearchParams } from "../_lib/discovery-search-params";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComparePage({ searchParams }: Props) {
  await requireAuthenticatedUser();

  const productIds = parseCompareSearchParams(await searchParams);
  const results = await Promise.all(
    productIds.map((productId) =>
      findDiscoveryProduct(productId).then(
        (product) => ({ product, status: "found" as const }),
        () => ({ status: "missing" as const }),
      ),
    ),
  );
  const products = results.flatMap((result) =>
    result.status === "found" ? [result.product] : [],
  );
  const missingCount = results.length - products.length;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-2">
        <Badge variant="outline">Hasta 4 productos</Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Comparar productos</h1>
        <p className="max-w-2xl text-muted-foreground">Revisá las opciones seleccionadas lado a lado para identificar sus diferencias con claridad.</p>
      </header>

      {missingCount > 0 && products.length > 0 ? (
        <Alert>
          <AlertTitle>Comparación parcial</AlertTitle>
          <AlertDescription>
            {missingCount === 1
              ? "No pudimos recuperar uno de los productos seleccionados. Mostramos el resto."
              : `No pudimos recuperar ${missingCount} de los productos seleccionados. Mostramos el resto.`}
          </AlertDescription>
        </Alert>
      ) : null}

      {products.length > 0 ? (
        <section aria-label="Productos seleccionados para comparar" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product, index) => (
            <Card key={product.id} className="h-full">
              <CardHeader className="border-b">
                <Badge variant="secondary">Opción {index + 1}</Badge>
                <CardTitle className="mt-2 text-xl">{product.name}</CardTitle>
                <CardDescription>{product.model || "Modelo no informado"}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</span>
                <p className="leading-6">{product.description || "Sin descripción disponible."}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyTitle>{productIds.length > 0 ? "No encontramos los productos seleccionados" : "Elegí productos para comparar"}</EmptyTitle>
            <EmptyDescription>
              {productIds.length > 0
                ? "Los productos pueden no estar disponibles o sus consultas pueden haber fallado. Volvé a Inicio para elegir otras opciones."
                : "Seleccioná al menos dos productos desde Inicio para verlos lado a lado."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
