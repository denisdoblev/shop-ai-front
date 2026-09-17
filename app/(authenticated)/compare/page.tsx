import { Bot, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
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
import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { parseCompareSearchParams } from "../_lib/discovery-search-params";
import { CompareTable } from "./_components/CompareTable";
import { CompareSelectionSync } from "./_components/CompareSelectionSync";
import { loadCompareProducts } from "./_lib/compare-products";

export const metadata: Metadata = {
  title: "Comparar productos",
  description: "Compará precios y especificaciones reales del catálogo de ShopAI.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function partialComparisonMessage(missingProductCount: number) {
  if (missingProductCount === 1) {
    return "No pudimos recuperar uno de los productos seleccionados. Mostramos el resto con todos los datos disponibles.";
  }
  if (missingProductCount > 1) {
    return `No pudimos recuperar ${missingProductCount} de los productos seleccionados. Mostramos el resto con todos los datos disponibles.`;
  }
  return "No pudimos recuperar algunos datos auxiliares. Los productos siguen disponibles y mostramos “No informado” donde corresponde.";
}

export default async function ComparePage({ searchParams }: Props) {
  await requireAuthenticatedUser();

  const rawSearchParams = await searchParams;
  const productIds = parseCompareSearchParams(rawSearchParams);
  const result = await loadCompareProducts(productIds);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <CompareSelectionSync
        products={result.products.map(({ id, name }) => ({ id, name }))}
        shouldReplaceSelection={rawSearchParams.productId !== undefined}
      />
      <header className="flex max-w-3xl flex-col items-start gap-4">
        <Badge variant="outline">Comparación de catálogo</Badge>
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Compará lo que realmente importa
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Precios, modelos y especificaciones reales, ordenados para que las diferencias sean fáciles de ver.
          </p>
        </div>
      </header>

      {result.hasPartialFailure && result.products.length > 0 ? (
        <Alert>
          <AlertTitle>Comparación parcial</AlertTitle>
          <AlertDescription>
            {partialComparisonMessage(result.missingProductCount)}
          </AlertDescription>
        </Alert>
      ) : null}

      {result.products.length > 0 ? (
        <CompareTable productIds={productIds} result={result} />
      ) : (
        <Empty className="min-h-80 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bot />
            </EmptyMedia>
            <EmptyTitle>
              {productIds.length > 0
                ? "No encontramos los productos seleccionados"
                : "Elegí productos para comparar"}
            </EmptyTitle>
            <EmptyDescription>
              {productIds.length > 0
                ? "Los productos pueden no estar disponibles. Volvé a Inicio para elegir otras opciones."
                : "Seleccioná productos desde Inicio y volvé cuando quieras verlos lado a lado."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/" />} nativeButton={false}>
              Ir a Inicio
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {result.products.length >= 2 ? (
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-primary/10 blur-3xl" />
          <CardHeader className="relative max-w-3xl">
            <Badge variant="secondary">
              <Sparkles data-icon="inline-start" />
              Veredicto de IA · Vista previa
            </Badge>
            <CardTitle className="text-xl sm:text-2xl">
              El veredicto personalizado de ShopAI estará disponible próximamente
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              ShopAI analizará tus prioridades junto con las especificaciones de cada producto para explicar qué opción se ajusta mejor a lo que necesitás.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-muted-foreground">
              Esta vista previa no representa una recomendación ni selecciona ganadores.
            </p>
          </CardContent>
          <CardFooter className="relative flex flex-wrap gap-3">
            <Button disabled>
              <Bot data-icon="inline-start" />
              Preguntar sobre este veredicto
            </Button>
            <span className="text-sm text-muted-foreground">Próximamente</span>
          </CardFooter>
        </Card>
      ) : null}
    </main>
  );
}
