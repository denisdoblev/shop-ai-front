"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { login } from "@/lib/auth/client";
import { queryKeys } from "@/lib/query/keys";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.session, user);
    },
  });
}
