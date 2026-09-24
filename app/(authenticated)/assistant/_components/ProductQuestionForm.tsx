"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenIcon, Sparkles, UserRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type {
  AiAskErrorResponse,
  AiAskRequest,
  AiAskResponse,
  AiAskSource,
} from "@/lib/ai/contracts";

type Props = {
  productId: string;
  productName: string;
};

type Exchange = {
  id: number;
  question: string;
  response: AiAskResponse;
};

const INVALID_QUESTION_MESSAGE =
  "Escribí una pregunta de entre 1 y 1000 caracteres.";
const GENERIC_ERROR_MESSAGE =
  "No pudimos responder tu pregunta. Intentá de nuevo.";

function errorMessage(status: number): string {
  if (status === 400) return INVALID_QUESTION_MESSAGE;
  if (status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
  if (status === 404) return "Este producto ya no está disponible.";
  if (status === 503 || status === 504) {
    return "El asistente no está disponible temporalmente. Intentá de nuevo.";
  }
  return GENERIC_ERROR_MESSAGE;
}

export function formatSourcePages(source: AiAskSource): string | null {
  const { pageStart, pageEnd } = source;

  if (pageStart === null && pageEnd === null) return null;
  if (pageStart !== null && pageEnd !== null) {
    return pageStart === pageEnd
      ? `Página ${pageStart}`
      : `Páginas ${pageStart}–${pageEnd}`;
  }
  if (pageStart !== null) return `Desde página ${pageStart}`;
  return `Hasta página ${pageEnd}`;
}

function SourceItem({ source }: { source: AiAskSource }) {
  const pages = formatSourcePages(source);
  const section = source.section?.trim();

  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{source.documentName}</span>
        {pages ? <Badge variant="outline">{pages}</Badge> : null}
        {section ? <Badge variant="secondary">{section}</Badge> : null}
      </div>
    </li>
  );
}

function ConversationExchange({
  exchange,
  isLatest,
  latestRef,
}: {
  exchange: Exchange;
  isLatest: boolean;
  latestRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <article
      className="flex scroll-m-6 flex-col gap-3"
      ref={isLatest ? latestRef : undefined}
    >
      <div className="ml-auto flex max-w-[90%] items-start gap-2 rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground sm:max-w-[78%]">
        <UserRound aria-hidden="true" className="mt-0.5 shrink-0" />
        <p className="whitespace-pre-line text-sm leading-6">{exchange.question}</p>
      </div>

      <div className="flex max-w-[96%] flex-col gap-4 rounded-2xl rounded-tl-sm border bg-muted/30 px-4 py-4 sm:max-w-[86%]">
        <div className="flex items-start gap-2">
          <Sparkles aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="mb-1 font-medium">Respuesta</p>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {exchange.response.answer}
            </p>
          </div>
        </div>

        {exchange.response.sources.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <BookOpenIcon aria-hidden="true" />
              Fuentes
            </h3>
            <ul className="flex flex-col gap-2">
              {exchange.response.sources.map((source) => (
                <SourceItem key={source.chunkId} source={source} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ProductQuestionForm({ productId, productName }: Props) {
  const router = useRouter();
  const generatedId = useId();
  const textareaId = `${generatedId}-question`;
  const descriptionId = `${generatedId}-description`;
  const counterId = `${generatedId}-counter`;
  const fieldErrorId = `${generatedId}-field-error`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageRef = useRef<HTMLElement>(null);
  const nextExchangeId = useRef(0);
  const requestInFlight = useRef(false);
  const refocusAfterSuccess = useRef(false);
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (exchanges.length > 0) {
      latestMessageRef.current?.scrollIntoView?.({ block: "nearest" });
    }
    if (!isPending && refocusAfterSuccess.current) {
      refocusAfterSuccess.current = false;
      textareaRef.current?.focus();
    }
  }, [exchanges.length, isPending]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current) return;

    setFieldError(null);
    setServiceError(null);

    if (question.length < 1 || question.length > 1000 || !/\S/.test(question)) {
      setFieldError(INVALID_QUESTION_MESSAGE);
      textareaRef.current?.focus();
      return;
    }

    requestInFlight.current = true;
    setIsPending(true);
    const submittedQuestion = question;
    const body: AiAskRequest = { productId, question: submittedQuestion };

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseError = (await response.json().catch(() => null)) as
          | AiAskErrorResponse
          | null;
        const status = responseError?.statusCode ?? response.status;
        if (status === 400) {
          setFieldError(errorMessage(status));
          textareaRef.current?.focus();
        } else {
          setServiceError(errorMessage(status));
        }
        if (status === 401) router.refresh();
        return;
      }

      const result = (await response.json()) as AiAskResponse;
      nextExchangeId.current += 1;
      setExchanges((current) => [
        ...current,
        {
          id: nextExchangeId.current,
          question: submittedQuestion,
          response: result,
        },
      ]);
      setQuestion("");
      refocusAfterSuccess.current = true;
    } catch {
      setServiceError(GENERIC_ERROR_MESSAGE);
    } finally {
      requestInFlight.current = false;
      setIsPending(false);
    }
  }

  const describedBy = [descriptionId, counterId, fieldError ? fieldErrorId : null]
    .filter(Boolean)
    .join(" ");
  const latestAnswer = exchanges.at(-1)?.response.answer ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
        {latestAnswer}
      </div>

      {exchanges.length > 0 ? (
        <section
          aria-label="Historial de esta conversación"
          className="flex max-h-[34rem] flex-col gap-6 overflow-y-auto pr-1"
        >
          {exchanges.map((exchange, index) => (
            <ConversationExchange
              exchange={exchange}
              isLatest={index === exchanges.length - 1}
              key={exchange.id}
              latestRef={latestMessageRef}
            />
          ))}
        </section>
      ) : (
        <Alert role="note">
          <Sparkles />
          <AlertTitle>Listo para tu primera pregunta</AlertTitle>
          <AlertDescription>
            Consultá características, uso o detalles respaldados por las fuentes del
            producto.
          </AlertDescription>
        </Alert>
      )}

      <form
        aria-busy={isPending}
        aria-label={`Preguntar sobre ${productName}`}
        className="flex flex-col gap-4 border-t pt-5"
        onSubmit={handleSubmit}
      >
        {serviceError ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo completar la consulta</AlertTitle>
            <AlertDescription>{serviceError}</AlertDescription>
          </Alert>
        ) : null}

        <FieldGroup>
          <Field
            data-disabled={isPending || undefined}
            data-invalid={!!fieldError || undefined}
          >
            <FieldLabel htmlFor={textareaId}>Tu pregunta</FieldLabel>
            <Textarea
              aria-describedby={describedBy}
              aria-invalid={!!fieldError}
              disabled={isPending}
              id={textareaId}
              name="question"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ej.: ¿Tiene cancelación activa de ruido?"
              ref={textareaRef}
              rows={3}
              value={question}
            />
            <div className="flex items-start justify-between gap-3">
              <FieldDescription id={descriptionId}>
                Cada envío usa sólo esta pregunta y el producto seleccionado.
              </FieldDescription>
              <span
                className="shrink-0 text-xs text-muted-foreground"
                id={counterId}
              >
                {question.length}/1000
              </span>
            </div>
            {fieldError ? (
              <FieldError id={fieldErrorId}>{fieldError}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>

        <Button className="self-end" disabled={isPending} type="submit">
          {isPending ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {isPending ? "Consultando…" : "Preguntar"}
        </Button>
      </form>
    </div>
  );
}
