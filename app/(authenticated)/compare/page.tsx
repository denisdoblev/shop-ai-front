import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function ComparePage() {
  await requireAuthenticatedUser();

  return <h1 className="p-8 text-3xl font-semibold">Compare</h1>;
}
