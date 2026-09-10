import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { BrandForm } from "../_components/BrandForm";

export default async function NewBrandPage() {
  await requireAuthenticatedUser();

  return <BrandForm mode="create" />;
}
