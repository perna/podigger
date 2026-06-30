/**
 * T077 — LoginForm.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/shared/ui";
import { isAppError } from "@/shared/api";
import { useLoginMutation } from "../hooks/useLoginMutation";
import type { LoginInput } from "../types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(schema) });

  const errorMessage =
    mutation.error && isAppError(mutation.error)
      ? mutation.error.toUserMessage()
      : mutation.error
        ? "Something went wrong."
        : null;

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await mutation.mutateAsync(values);
        onSuccess?.();
      })}
      className="flex flex-col gap-4"
    >
      <Input
        type="email"
        label="Email"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        type="password"
        label="Password"
        autoComplete="current-password"
        {...register("password")}
        error={errors.password?.message}
      />
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
        Sign in
      </Button>
    </form>
  );
}
