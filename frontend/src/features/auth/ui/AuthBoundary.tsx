/**
 * T079 — AuthBoundary.
 *
 * Gates a child on useAuth().user being non-null and (optionally)
 * having the required role. Renders the existing "Acesso Negado"
 * UI for the wrong role.
 */

"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/shared/store/slices/auth";
import type { User } from "@/shared/store/slices/auth";

export interface AuthBoundaryProps {
  children: ReactNode;
  predicate?: (user: User | null) => boolean;
  fallback?: ReactNode;
}

const DEFAULT_FALLBACK = (
  <div
    role="alert"
    className="flex flex-col items-center justify-center gap-3 p-8 text-center"
  >
    <h2 className="text-xl font-semibold">Acesso Negado</h2>
    <p className="text-sm text-surface-500">
      Você não tem permissão para visualizar este conteúdo.
    </p>
    <a
      href="/login"
      className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      Entrar
    </a>
  </div>
);

export function AuthBoundary({ children, predicate, fallback }: AuthBoundaryProps) {
  const { user, _hasHydrated } = useAuth();

  if (!_hasHydrated) {
    return null;
  }

  const allowed = predicate ? predicate(user) : user !== null;
  if (!allowed) {
    return <>{fallback ?? DEFAULT_FALLBACK}</>;
  }

  return <>{children}</>;
}
