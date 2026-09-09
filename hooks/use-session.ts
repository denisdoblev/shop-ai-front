"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSession, logout } from "@/lib/auth/client";
import { queryKeys } from "@/lib/query/keys";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: ({ signal }) => getSession({ signal }),
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
