"use client";

// Feature: api-authentication-strategy
// Requirements: 13.1, 13.5

import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center p-4 font-display">
      <div className="relative w-full max-w-[420px] bg-[#121212] shadow-2xl overflow-hidden rounded-[3rem] flex flex-col border-[8px] border-[#2a2a2a] min-h-[600px]">
        {/* iOS-like status bar */}
        <div className="h-12 w-full flex justify-between items-center px-8 pt-4">
          <span className="text-sm font-bold text-white">9:41</span>
          <div className="flex gap-1.5 items-center">
            <Icon name="signal_cellular_4_bar" className="text-white text-[18px]" fill={true} />
            <Icon name="wifi" className="text-white text-[18px]" fill={true} />
            <Icon name="battery_full" className="text-white text-[18px]" fill={true} />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 flex flex-col px-6 justify-center items-center text-center gap-8">
          <div className="size-24 bg-yellow-500/15 rounded-3xl flex items-center justify-center ring-1 ring-yellow-500/30 text-yellow-400">
            <Icon name="lock" className="text-6xl" />
          </div>

          <div className="space-y-3">
            <h1 className="text-white tracking-tight text-2xl font-extrabold leading-tight">
              Acesso restrito
            </h1>
            <p className="text-zinc-400 text-base px-4">
              Você precisa estar autenticado para acessar esta página.
            </p>
          </div>

          <a
            href={loginHref}
            className="w-full h-14 bg-[#0db9f2] hover:bg-[#0db9f2]/90 text-black font-extrabold text-lg rounded-xl shadow-lg shadow-[#0db9f2]/20 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Fazer login</span>
            <div className="group-hover:translate-x-1 transition-transform flex" aria-hidden="true">
              <Icon name="arrow_forward" />
            </div>
          </a>
        </div>

        {/* Footer home bar */}
        <div className="py-8 flex justify-center">
          <div className="w-32 h-1.5 bg-zinc-800 rounded-full" />
        </div>
      </div>

      {/* Background glows */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10" aria-hidden="true" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10" aria-hidden="true" />
    </div>
  );
}
