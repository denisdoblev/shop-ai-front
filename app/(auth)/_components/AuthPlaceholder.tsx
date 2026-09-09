import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type AuthPlaceholderProps = {
  backHref?: string;
  description: string;
  eyebrow: string;
  title: string;
};

export function AuthPlaceholder({
  backHref = "/login",
  description,
  eyebrow,
  title,
}: AuthPlaceholderProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-auth-surface px-5 py-12 text-auth-ink sm:px-10">
      <section className="w-full max-w-2xl rounded-2xl border bg-card p-8 text-card-foreground shadow-sm sm:p-12">
        <p className="font-label text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-prose leading-7 text-muted-foreground">
          {description}
        </p>
        <Link
          href={backHref}
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft aria-hidden="true" />
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}
