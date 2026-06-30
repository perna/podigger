/**
 * T090 — Register page (thin composition).
 */

import Link from "next/link";
import { RegisterForm } from "@/features/auth";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <RegisterForm />
      <p className="text-sm text-surface-500">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-500 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
