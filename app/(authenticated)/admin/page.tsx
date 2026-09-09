import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function AdminOverviewPage() {
  await requireAuthenticatedUser();

  return <h1 className="p-8 text-3xl font-semibold">Overview</h1>;
}
