"use client";

// Feature: api-authentication-strategy
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.7

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/Icon";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPendingMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Requirement 8.2, 8.7: store role and email in AuthContext, then redirect
        const data = await response.json();
        login(data.role, data.email);
        const next = searchParams.get("next");
        router.push(next || "/");
        return;
      }

      if (response.status === 403) {
        // Requirement 8.3: pending account — show message without redirecting
        setPendingMessage("Sua conta aguarda aprovação de um administrador.");
        return;
      }

      if (response.status === 401) {
        // Requirement 8.4: invalid credentials — generic error, no field hints
        setError("Email ou senha inválidos.");
        return;
      }

      // Unexpected error
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Top actions */}
      <div className="flex items-center p-6 pb-2 justify-between">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-[#0db9f2] transition-colors flex items-center justify-center size-10 rounded-full bg-[#252525]"
          type="button"
          aria-label="Voltar"
        >
          <Icon name="arrow_back_ios_new" />
        </button>
        <h2 className="text-zinc-300 text-base font-semibold">Entrar</h2>
        <div className="size-10" aria-hidden="true" />
      </div>

      {/* Page content */}
      <div className="flex-1 flex flex-col px-6 justify-center mt-4">
        <div className="flex justify-center mb-8">
          <div className="size-20 bg-[#0db9f2]/15 rounded-2xl flex items-center justify-center ring-1 ring-[#0db9f2]/30 text-[#0db9f2]">
            <Icon name="lock_open" className="text-5xl" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-white tracking-tight text-3xl font-extrabold leading-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-zinc-400 text-base mt-3 px-4">
            Entre com seu email e senha para acessar o Podigger.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1E1E1E] border border-white/10 p-6 rounded-lg space-y-6 shadow-xl"
          noValidate
        >
          {/* Email field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-zinc-100 text-xs font-bold ml-1 uppercase tracking-widest"
            >
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input flex w-full rounded-xl text-white caret-[#0db9f2] focus:outline-0 focus:ring-2 focus:ring-[#0db9f2]/40 border border-zinc-700 bg-[#252525] h-14 placeholder:text-zinc-500 px-5 py-4 text-base font-normal leading-normal transition-all"
                placeholder="voce@exemplo.com"
                disabled={isLoading}
                aria-describedby={error ? "login-error" : undefined}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 flex" aria-hidden="true">
                <Icon name="mail" />
              </div>
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-zinc-100 text-xs font-bold ml-1 uppercase tracking-widest"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input flex w-full rounded-xl text-white caret-[#0db9f2] focus:outline-0 focus:ring-2 focus:ring-[#0db9f2]/40 border border-zinc-700 bg-[#252525] h-14 placeholder:text-zinc-500 px-5 py-4 text-base font-normal leading-normal transition-all"
                placeholder="••••••••"
                disabled={isLoading}
                aria-describedby={error ? "login-error" : undefined}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 flex" aria-hidden="true">
                <Icon name="key" />
              </div>
            </div>
          </div>

          {/* Inline error — invalid credentials (Requirement 8.4) */}
          {error && (
            <div
              id="login-error"
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 text-red-400 text-sm font-medium"
            >
              <Icon name="error" className="text-base shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pending account message (Requirement 8.3) */}
          {pendingMessage && (
            <div
              id="login-pending"
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-yellow-400 text-sm font-medium"
            >
              <Icon name="schedule" className="text-base shrink-0" />
              <span>{pendingMessage}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-[#0db9f2] hover:bg-[#0db9f2]/90 disabled:bg-zinc-600 disabled:text-zinc-400 text-black font-extrabold text-lg rounded-xl shadow-lg shadow-[#0db9f2]/20 transition-all flex items-center justify-center gap-2 group"
            aria-busy={isLoading}
          >
            <span>{isLoading ? "Entrando..." : "Entrar"}</span>
            {!isLoading && (
              <div className="group-hover:translate-x-1 transition-transform flex" aria-hidden="true">
                <Icon name="arrow_forward" />
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="py-8 flex flex-col items-center mt-auto gap-3">
        <p className="text-zinc-500 text-sm">
          Não tem uma conta?{" "}
          <Link
            href="/register"
            className="text-[#0db9f2] font-semibold hover:underline"
          >
            Criar conta
          </Link>
        </p>
        <div className="mt-4 w-32 h-1.5 bg-zinc-800 rounded-full" />
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center p-4 font-display">
      <div className="relative w-full max-w-[420px] bg-[#121212] shadow-2xl overflow-hidden rounded-[3rem] flex flex-col border-[8px] border-[#2a2a2a] min-h-[800px]">
        {/* iOS-like status bar */}
        <div className="h-12 w-full flex justify-between items-center px-8 pt-4">
          <span className="text-sm font-bold text-white">9:41</span>
          <div className="flex gap-1.5 items-center">
            <Icon name="signal_cellular_4_bar" className="text-white text-[18px]" fill={true} />
            <Icon name="wifi" className="text-white text-[18px]" fill={true} />
            <Icon name="battery_full" className="text-white text-[18px]" fill={true} />
          </div>
        </div>

        <Suspense fallback={<div className="flex-1" />}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Background glows */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10" aria-hidden="true" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10" aria-hidden="true" />
    </div>
  );
}
