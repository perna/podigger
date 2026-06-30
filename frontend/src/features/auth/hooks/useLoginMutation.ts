/**
 * T074 — useLoginMutation.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, queryKeys } from "@/shared/api";
import { useAuthStore } from "@/shared/store/slices/auth";
import type { LoginInput } from "../types";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (response) => {
      login(response.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session() });
    },
  });
}
