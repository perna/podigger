/**
 * T076 — useLogoutMutation.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, queryKeys } from "@/shared/api";
import { useAuthStore } from "@/shared/store/slices/auth";

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      void queryClient.invalidateQueries({ queryKey: queryKeys.session() });
    },
  });
}
