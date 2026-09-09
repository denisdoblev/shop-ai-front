import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function BrandsPage() {
  await requireAuthenticatedUser();

  return <h1 className="p-8 text-3xl font-semibold">Brands</h1>;
}
