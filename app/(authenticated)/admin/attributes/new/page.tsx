import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { AttributeForm } from "../_components/AttributeForm";

export default async function NewAttributePage() {
  await requireAuthenticatedUser();

  return <AttributeForm mode="create" />;
}
