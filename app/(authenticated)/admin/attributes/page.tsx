import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { AttributesCrud } from "./_components/AttributesCrud";
import { getAttributes } from "./_lib/attributes";

type AttributesPageProps = {
  searchParams: Promise<{
    name?: string | string[];
    page?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function getPage(value: string | string[] | undefined): number {
  const parsedPage = Number(getSingleSearchParam(value));
  return Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

export default async function AttributesPage({
  searchParams,
}: AttributesPageProps) {
  await requireAuthenticatedUser();

  const params = await searchParams;
  const name = getSingleSearchParam(params.name).trim().slice(0, 100);
  const page = getPage(params.page);
  const attributesPage = await getAttributes({
    name: name || undefined,
    page,
  });

  return (
    <AttributesCrud
      attributes={attributesPage.items}
      hasNext={attributesPage.hasNext}
      name={name}
      page={page}
    />
  );
}
