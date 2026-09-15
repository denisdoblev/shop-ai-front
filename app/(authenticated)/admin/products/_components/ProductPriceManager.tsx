"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { registerProductPrice } from "../actions";
import { PRODUCT_PRICE_MAX, productPriceSchema } from "../_lib/ProductFormSchema";
import type { ProductPrice, ProductPriceFormValues } from "../_types/Product";

type Props = {
  prices: ProductPrice[];
  productId: string;
};

const PRICE_ID = "new-product-price";
const PRICE_ERROR_ID = "new-product-price-error";
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  second: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
  year: "numeric",
});

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-ES", { currency, currencyDisplay: "code", style: "currency" }).format(price);
  } catch {
    return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(price)} ${currency}`;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function ProductPriceManager({ prices, productId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { formState: { errors }, handleSubmit, register, resetField, setError } = useForm<ProductPriceFormValues>({
    resolver: zodResolver(productPriceSchema),
  });
  const current = prices[0];
  const priceError = errors.price ?? errors.root?.server;

  function submit(values: ProductPriceFormValues) {
    startTransition(async () => {
      const result = await registerProductPrice(productId, values);
      if (!result.success) {
        const priceError = result.fieldErrors?.price?.[0];
        if (priceError) setError("price", { message: priceError, type: "server" });
        setError("root.server", { message: result.message, type: "server" });
        return;
      }
      resetField("price");
      toast.success("Nuevo precio registrado.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Precios</CardTitle>
            <CardDescription>Histórico inmutable de importes registrados para este producto.</CardDescription>
          </div>
          <CircleDollarSign className="text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-7">
        <div className="rounded-xl bg-muted/50 p-5 ring-1 ring-foreground/10">
          <p className="font-label text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">Precio actual</p>
          {current ? (
            <p className="mt-2 font-heading text-3xl font-medium tracking-tight sm:text-4xl">{formatPrice(current.price, current.currency)}</p>
          ) : (
            <p className="mt-2 text-lg font-medium text-muted-foreground">Sin precio registrado</p>
          )}
        </div>

        <form noValidate onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(priceError)}>
              <FieldLabel htmlFor={PRICE_ID}>Nuevo importe</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <InputGroup>
                  <InputGroupInput
                    {...register("price", { setValueAs: (value) => value === "" ? Number.NaN : Number(value) })}
                    id={PRICE_ID}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={PRODUCT_PRICE_MAX}
                    step="0.01"
                    required
                    autoComplete="off"
                    disabled={pending}
                    aria-invalid={Boolean(priceError)}
                    aria-describedby={priceError ? PRICE_ERROR_ID : "new-product-price-help"}
                    placeholder="0,00"
                  />
                  <InputGroupAddon align="inline-end">USD</InputGroupAddon>
                </InputGroup>
                <Button className="sm:shrink-0" type="submit" disabled={pending}>
                  {pending ? <Spinner data-icon="inline-start" /> : <CircleDollarSign data-icon="inline-start" />}
                  {pending ? "Registrando…" : "Registrar nuevo precio"}
                </Button>
              </div>
              <FieldDescription id="new-product-price-help">Cada guardado agrega un registro en USD con la hora del servidor; nunca sobrescribe el precio anterior.</FieldDescription>
              <FieldError id={PRICE_ERROR_ID}>{priceError?.message}</FieldError>
            </Field>
          </FieldGroup>
        </form>

        {prices.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><History /></EmptyMedia>
              <EmptyTitle>Aún no hay histórico</EmptyTitle>
              <EmptyDescription>Registra el primer precio para comenzar la trazabilidad.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableCaption className="sr-only">Histórico completo de precios, del más reciente al más antiguo.</TableCaption>
            <TableHeader><TableRow><TableHead>Importe</TableHead><TableHead>Fecha de registro</TableHead><TableHead className="text-right">Estado</TableHead></TableRow></TableHeader>
            <TableBody>{prices.map((price, index) => (
              <TableRow key={price.id}>
                <TableCell className="font-medium">{formatPrice(price.price, price.currency)}</TableCell>
                <TableCell><time dateTime={price.recordedAt}>{formatDate(price.recordedAt)}</time></TableCell>
                <TableCell className="text-right">{index === 0 ? <Badge variant="success">Actual</Badge> : <span className="text-muted-foreground">Histórico</span>}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
