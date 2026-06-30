/**
 * T075 — useRegisterMutation.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, queryKeys } from "@/shared/api";
import { useAuthStore } from "@/shared/store/slices/auth";
import type { RegisterInput } from "../types";

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (response) => {
      login(response.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session() });
    },
  });
}
