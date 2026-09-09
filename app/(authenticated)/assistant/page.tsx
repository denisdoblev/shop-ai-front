import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function AssistantPage() {
  await requireAuthenticatedUser();

  return <h1 className="p-8 text-3xl font-semibold">AI Assistant</h1>;
}
