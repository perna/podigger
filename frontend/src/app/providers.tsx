"use client";

import { type ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { StoreHydration } from "@/shared/store/StoreHydration";
import { createQueryClient } from "@/shared/api";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <StoreHydration>{children}</StoreHydration>
    </QueryClientProvider>
  );
}
