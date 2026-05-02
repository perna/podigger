"use client";

// Feature: api-authentication-strategy
// Requirements: 3.6, 3.7

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Requirement 3.6: client-side validation — passwords must match
    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 201) {
        // Requirement 3.7: show success message, no redirect
        setSuccessMessage(
          "Conta criada com sucesso! Aguarde a aprovação de um administrador.",
        );
        return;
      }

      if (response.status === 400) {
        // Requirement 3.6: show descriptive error inline
        const data = await response.json().catch(() => ({}));
        const detail =
          data.detail ??
          data.email?.[0] ??
          data.password?.[0] ??
          "Dados inválidos. Verifique os campos e tente novamente.";
        setError(detail);
        return;
      }

      setError("Ocorreu um erro inesperado. Tente novamente.");
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2 className="text-zinc-300 text-base font-semibold">Criar conta</h2>
          <div className="size-10" aria-hidden="true" />
        </div>

        {/* Page content */}
        <div className="flex-1 flex flex-col px-6 justify-center mt-4">
          <div className="flex justify-center mb-8">
            <div className="size-20 bg-[#0db9f2]/15 rounded-2xl flex items-center justify-center ring-1 ring-[#0db9f2]/30 text-[#0db9f2]">
              <Icon name="person_add" className="text-5xl" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-white tracking-tight text-3xl font-extrabold leading-tight">
              Crie sua conta
            </h1>
            <p className="text-zinc-400 text-base mt-3 px-4">
              Registre-se para solicitar acesso ao Podigger.
            </p>
          </div>

          {/* Success state — show message, hide form */}
          {successMessage ? (
            <div
              role="status"
              aria-live="polite"
              className="bg-[#1E1E1E] border border-white/10 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4 text-center"
            >
              <div className="size-14 bg-green-500/15 rounded-2xl flex items-center justify-center ring-1 ring-green-500/30 text-green-400">
                <Icon name="check_circle" className="text-4xl" />
              </div>
              <p className="text-green-400 text-base font-medium">{successMessage}</p>
              <a
                href="/login"
                className="text-[#0db9f2] text-sm font-semibold hover:underline"
              >
                Ir para o login
              </a>
            </div>
          ) : (
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
                    aria-describedby={error ? "register-error" : undefined}
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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input flex w-full rounded-xl text-white caret-[#0db9f2] focus:outline-0 focus:ring-2 focus:ring-[#0db9f2]/40 border border-zinc-700 bg-[#252525] h-14 placeholder:text-zinc-500 px-5 py-4 text-base font-normal leading-normal transition-all"
                    placeholder="Mínimo 8 caracteres"
                    disabled={isLoading}
                    aria-describedby={error ? "register-error" : undefined}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 flex" aria-hidden="true">
                    <Icon name="key" />
                  </div>
                </div>
              </div>

              {/* Password confirm field */}
              <div className="space-y-2">
                <label
                  htmlFor="password_confirm"
                  className="block text-zinc-100 text-xs font-bold ml-1 uppercase tracking-widest"
                >
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="password_confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="form-input flex w-full rounded-xl text-white caret-[#0db9f2] focus:outline-0 focus:ring-2 focus:ring-[#0db9f2]/40 border border-zinc-700 bg-[#252525] h-14 placeholder:text-zinc-500 px-5 py-4 text-base font-normal leading-normal transition-all"
                    placeholder="Repita a senha"
                    disabled={isLoading}
                    aria-describedby={error ? "register-error" : undefined}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 flex" aria-hidden="true">
                    <Icon name="lock" />
                  </div>
                </div>
              </div>

              {/* Inline error */}
              {error && (
                <div
                  id="register-error"
                  role="alert"
                  aria-live="assertive"
                  className="flex items-center gap-2 text-red-400 text-sm font-medium"
                >
                  <Icon name="error" className="text-base shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[#0db9f2] hover:bg-[#0db9f2]/90 disabled:bg-zinc-600 disabled:text-zinc-400 text-black font-extrabold text-lg rounded-xl shadow-lg shadow-[#0db9f2]/20 transition-all flex items-center justify-center gap-2 group"
                aria-busy={isLoading}
              >
                <span>{isLoading ? "Criando conta..." : "Criar conta"}</span>
                {!isLoading && (
                  <div className="group-hover:translate-x-1 transition-transform flex" aria-hidden="true">
                    <Icon name="arrow_forward" />
                  </div>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="py-8 flex flex-col items-center mt-auto gap-3">
          <p className="text-zinc-500 text-sm">
            Já tem uma conta?{" "}
            <a
              href="/login"
              className="text-[#0db9f2] font-semibold hover:underline"
            >
              Entrar
            </a>
          </p>
          <div className="mt-4 w-32 h-1.5 bg-zinc-800 rounded-full" />
        </div>
      </div>

      {/* Background glows */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10" aria-hidden="true" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10" aria-hidden="true" />
    </div>
  );
}
