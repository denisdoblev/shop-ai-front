import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function TemplatesPage() {
  await requireAuthenticatedUser();

  return <h1 className="p-8 text-3xl font-semibold">Templates</h1>;
}
