import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PackageSearch, Search, Sparkles } from "lucide-react";

import { AskAiLink } from "@/components/AskAiLink/AskAiLink";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { HttpError } from "@/lib/http/errors";
import {
  buildAssistantHref,
  parseAssistantSearchParams,
} from "@/lib/assistant-url";
import { cn } from "@/lib/utils";

import { RemoteProductImage } from "../_components/RemoteProductImage";
import { findDiscoveryProducts } from "../_lib/discovery-catalog";
import { ProductQuestionForm } from "./_components/ProductQuestionForm";
import { loadAssistantProduct } from "./_lib/assistant-product";
import type { AssistantProduct } from "./_types/Assistant";

export const metadata: Metadata = {
  title: "Asistente de compra",
  description: "Preguntale a ShopAI por un producto de tu catálogo.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatPrice(product: AssistantProduct): string {
  if (product.price === null || !product.currency) return "Precio no disponible";

  try {
    return new Intl.NumberFormat("es-AR", {
      currency: product.currency,
      style: "currency",
    }).format(product.price);
  } catch {
    return `${product.price} ${product.currency}`;
  }
}

function ProductSearch({ query }: { query: string }) {
  return (
    <form action="/assistant" className="w-full max-w-2xl" method="get">
      <label className="sr-only" htmlFor="assistant-search">
        Buscar un producto
      </label>
      <InputGroup className="h-11 bg-card shadow-sm">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          defaultValue={query}
          id="assistant-search"
          name="q"
          pattern=".*\S.*"
          placeholder="Buscá por producto, modelo o marca"
          required
          title="Escribí una búsqueda"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" variant="default">
            Buscar
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

async function ProductSelector({ query }: { query: string }) {
  const products = query ? await findDiscoveryProducts({ query }) : [];

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="flex max-w-3xl flex-col gap-4">
        <Badge className="self-start" variant="outline">
          <Sparkles data-icon="inline-start" />
          Asistente de compra
        </Badge>
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            ¿Sobre qué producto querés preguntar?
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            Elegí un producto del catálogo para conversar con la IA usando su
            documentación disponible.
          </p>
        </div>
        <ProductSearch query={query} />
      </header>

      {query ? (
        products.length > 0 ? (
          <section aria-labelledby="assistant-results-title" className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold" id="assistant-results-title">
                Resultados para “{query}”
              </h2>
              <p className="text-sm text-muted-foreground">
                Seleccioná una opción para abrir su conversación.
              </p>
            </div>
            <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <Card className="h-full" key={product.id}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>
                      {product.model ??
                        product.description ??
                        "Sin modelo ni descripción disponible."}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <AskAiLink
                      className="w-full"
                      productId={product.id}
                      query={query}
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <Empty className="min-h-72 border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch />
              </EmptyMedia>
              <EmptyTitle>No encontramos productos</EmptyTitle>
              <EmptyDescription>
                Probá con el nombre, la marca o una búsqueda más amplia.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <Empty className="min-h-72 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>Empezá buscando en tu catálogo</EmptyTitle>
            <EmptyDescription>
              Cuando elijas un producto, vas a ver su información y el panel de
              conversación.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}

function MissingProduct({ query }: { query: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
      <Empty className="min-h-96 border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageSearch />
          </EmptyMedia>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Este producto no está disponible
          </h1>
          <EmptyDescription>
            Puede haberse eliminado o ya no formar parte del catálogo.
          </EmptyDescription>
        </EmptyHeader>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={buildAssistantHref({ query })}
        >
          <ArrowLeft data-icon="inline-start" />
          Elegir otro producto
        </Link>
      </Empty>
    </main>
  );
}

function FocusedAssistant({
  product,
  query,
}: {
  product: AssistantProduct;
  query: string;
}) {
  const productLabel = [product.brandName, product.model].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.45fr)]">
      <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
        <Link
          className={cn(buttonVariants({ variant: "ghost" }), "self-start")}
          href={buildAssistantHref({ query })}
        >
          <ArrowLeft data-icon="inline-start" />
          Cambiar producto
        </Link>
        <Card className="overflow-hidden">
          <div className="relative aspect-4/3 overflow-hidden bg-muted">
            <RemoteProductImage alt={product.name} src={product.imageUrl} />
          </div>
          <CardHeader>
            {productLabel ? (
              <Badge className="self-start" variant="outline">
                {productLabel}
              </Badge>
            ) : null}
            <h1 className="font-heading text-2xl font-semibold leading-snug">
              {product.name}
            </h1>
            <CardDescription>
              {product.description ?? "Sin descripción disponible."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-semibold">
              {formatPrice(product)}
            </p>
          </CardContent>
        </Card>
      </aside>

      <section aria-labelledby="conversation-title" className="min-w-0">
        <Card className="min-h-[34rem]">
          <CardHeader>
            <Badge className="self-start" variant="outline">
              <Sparkles data-icon="inline-start" />
              Enfocado en este producto
            </Badge>
            <h2 className="font-heading text-2xl font-semibold" id="conversation-title">
              Preguntale a la IA
            </h2>
            <CardDescription>
              Cada consulta es independiente. El historial sólo vive en esta pantalla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductQuestionForm
              key={product.id}
              productId={product.id}
              productName={product.name}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default async function AssistantPage({ searchParams }: Props) {
  const [, rawSearchParams] = await Promise.all([
    requireAuthenticatedUser(),
    searchParams,
  ]);
  const { productId, query } = parseAssistantSearchParams(rawSearchParams);

  if (!productId) return ProductSelector({ query });

  let product: AssistantProduct;
  try {
    product = await loadAssistantProduct(productId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return <MissingProduct query={query} />;
    }

    throw error;
  }

  return <FocusedAssistant product={product} query={query} />;
}
