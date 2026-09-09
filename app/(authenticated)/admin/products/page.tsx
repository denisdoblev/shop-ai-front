import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function ProductsPage() {
  await requireAuthenticatedUser();

  return <h1 className="p-8 text-3xl font-semibold">Products</h1>;
}
