"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useState } from "react";

const FALLBACK_IMAGE = "/images/shopai-laptop-hero.webp";

function passthroughLoader({ src }: ImageLoaderProps) {
  return src;
}

type RemoteProductImageProps = {
  alt: string;
  src: string | null;
};

export function RemoteProductImage({ alt, src }: RemoteProductImageProps) {
  const [failed, setFailed] = useState(false);
  const imageSource = !src || failed ? FALLBACK_IMAGE : src;

  return (
    <Image
      fill
      unoptimized
      alt={alt}
      loader={passthroughLoader}
      onError={() => setFailed(true)}
      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
      src={imageSource}
    />
  );
}
