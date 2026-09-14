import { ArrowLeft, Check, Sparkles } from "lucide-react";
import Link from "next/link";

import type { AuthShellProps } from "../_types/Auth";

const benefits = [
  "Mantén una lista de favoritos ordenada",
  "Continúa tus conversaciones con la IA",
  "Revisa tus comparaciones de productos",
];

const copy = {
  register: {
    title: <>Guarda los productos que merecen ser recordados.</>,
    description:
      "Crea una cuenta para mantener juntas tus comparaciones, conversaciones y recomendaciones.",
  },
  login: {
    title: <>Tu lista de favoritos te está esperando.</>,
    description:
      "Vuelve a tus productos guardados, comparaciones recientes y conversaciones con ShopAI.",
  },
};

export function AuthShell({ children, mode }: AuthShellProps) {
  const content = copy[mode];

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(28rem,1fr)_minmax(34rem,1.12fr)]">
      <section className="relative hidden min-h-svh overflow-hidden bg-auth-panel px-10 py-9 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div
          aria-hidden="true"
          className="absolute -right-52 -bottom-52 size-136 rounded-full border-[3.5rem] border-white/2.5 shadow-[0_0_0_3.5rem_rgba(255,255,255,0.018)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(99,102,241,0.13),transparent_35%),radial-gradient(circle_at_10%_90%,rgba(34,211,238,0.06),transparent_32%)]"
        />

        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          aria-label="Ir al inicio de ShopAI"
        >
          <span className="flex size-8 items-center justify-center rounded-[0.6rem] bg-primary shadow-[0_8px_22px_rgba(79,70,229,0.42)]">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <span className="font-heading text-lg font-extrabold tracking-tight">
            Shop<span className="text-[#9da1ff]">AI</span>
          </span>
        </Link>

        <div className="relative z-10 my-auto max-w-124 -translate-y-4">
          <p className="mb-7 flex items-center gap-2 font-heading text-[0.68rem] font-bold tracking-[0.14em] text-[#a9adff] uppercase">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Decisiones de compra más inteligentes
          </p>
          <h1 className="max-w-116 text-[clamp(3rem,4.25vw,4.7rem)] leading-[1.08] font-medium tracking-[-0.055em] text-white">
            {content.title}
          </h1>
          <p className="mt-6 max-w-116 text-base leading-7 text-auth-panel-muted">
            {content.description}
          </p>
          <ul className="mt-7 flex flex-col gap-3" aria-label="Ventajas de ShopAI">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2.5 text-sm text-[#d2d6e2]">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#7775ed]">
                  <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex max-w-120 items-center gap-3 border-t border-white/[0.07] pt-6 text-xs text-[#737b91]">
          <span className="flex [&>span+span]:-ml-1" aria-hidden="true">
            {[
              ["A", "bg-[#6667dd]"],
              ["D", "bg-[#36394a]"],
              ["F", "bg-[#292c3a]"],
            ].map(([letter, color]) => (
              <span key={letter} className={`flex size-6 items-center justify-center rounded-full border-2 border-auth-panel text-[0.6rem] font-bold text-white ${color}`}>
                {letter}
              </span>
            ))}
          </span>
          Diseñado para ayudarte a decidir, no para presionarte a comprar.
        </div>
      </section>

      <section className="flex min-h-svh flex-col bg-auth-surface px-5 py-5 sm:px-10 sm:py-8 xl:px-16 xl:py-12">
        <Link
          href="/"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md text-sm font-semibold text-auth-muted transition-colors hover:text-auth-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a ShopAI
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-132">{children}</div>
        </div>
      </section>
    </main>
  );
}
