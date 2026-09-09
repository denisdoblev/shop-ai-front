export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: ["auth", "session"] as const,
  },
} as const;
