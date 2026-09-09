import { describe, expect, it } from "vitest";

import { authFormSchema } from "./AuthFormSchema";

const sharedValues = {
  firstName: "",
  lastName: "",
  email: "user@example.com",
  acceptTerms: false,
  remember: false,
};

describe("authFormSchema", () => {
  it.each(["x", "x".repeat(100)])(
    "accepts a non-empty legacy password for login",
    (password) => {
      const result = authFormSchema.safeParse({
        ...sharedValues,
        mode: "login",
        password,
      });

      expect(result.success).toBe(true);
    },
  );

  it("requires a password for login", () => {
    const result = authFormSchema.safeParse({
      ...sharedValues,
      mode: "login",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("keeps password complexity and registration-only fields for register", () => {
    const result = authFormSchema.safeParse({
      ...sharedValues,
      mode: "register",
      password: "legacy",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining([
        "firstName",
        "lastName",
        "password",
        "acceptTerms",
      ]),
    );
  });
});
