import { Sparkles } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { buildAssistantHref } from "@/lib/assistant-url";
import { cn } from "@/lib/utils";

type AskAiLinkProps = {
  className?: string;
  productId: string;
  query?: string;
};

export function AskAiLink({ className, productId, query }: AskAiLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant: "default" }), className)}
      href={buildAssistantHref({ productId, query })}
    >
      <Sparkles data-icon="inline-start" />
      Preguntar a la IA
    </Link>
  );
}
