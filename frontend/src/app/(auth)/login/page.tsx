/**
 * T089 — Login page (thin composition).
 */

import Link from "next/link";
import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Sign in to Podigger</h1>
      <LoginForm />
      <p className="text-sm text-surface-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary-500 hover:underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
