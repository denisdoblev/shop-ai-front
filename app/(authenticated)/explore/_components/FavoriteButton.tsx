"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function FavoriteButton({
  available,
  initialFavorite,
  productId,
  productName,
}: {
  available: boolean;
  initialFavorite: boolean;
  productId: string;
  productName: string;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);
  const [previousInitialFavorite, setPreviousInitialFavorite] = useState(initialFavorite);

  if (initialFavorite !== previousInitialFavorite) {
    setPreviousInitialFavorite(initialFavorite);
    setFavorite(initialFavorite);
    setPending(false);
  }

  async function toggleFavorite() {
    const previous = favorite;
    const next = !previous;
    setFavorite(next);
    setPending(true);

    try {
      const response = await fetch(`/api/favorites/${encodeURIComponent(productId)}`, {
        method: next ? "PUT" : "DELETE",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch {
      setFavorite(previous);
      toast.error("No pudimos actualizar el favorito", {
        description: "Tu selección anterior fue restaurada. Probá nuevamente.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      aria-label={favorite ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`}
      aria-pressed={favorite}
      disabled={!available || pending}
      onClick={toggleFavorite}
      size="icon"
      title={available ? undefined : "Favoritos temporalmente no disponibles"}
      type="button"
      variant={favorite ? "soft" : "ghost"}
    >
      <Heart className={favorite ? "fill-current" : undefined} />
    </Button>
  );
}
