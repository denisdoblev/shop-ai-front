import type { Metadata } from "next";
import { Suspense } from "react";

import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { HomeContent } from "./_components/HomeContent";
import {
  HomeCategoriesSection,
  HomeCategoriesSkeleton,
  HomeProductsSection,
  HomeProductsSkeleton,
} from "./_components/HomeCatalogSections";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Explorá el catálogo y compará productos con ShopAI.",
};

export default async function Home() {
  await requireAuthenticatedUser();

  return (
    <HomeContent>
      <Suspense fallback={<HomeCategoriesSkeleton />}>
        <HomeCategoriesSection />
      </Suspense>
      <Suspense fallback={<HomeProductsSkeleton />}>
        <HomeProductsSection />
      </Suspense>
    </HomeContent>
  );
}
