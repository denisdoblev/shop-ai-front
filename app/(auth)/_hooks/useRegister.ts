"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { register } from "@/lib/auth/client";
import { queryKeys } from "@/lib/query/keys";

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.session, user);
    },
  });
}
