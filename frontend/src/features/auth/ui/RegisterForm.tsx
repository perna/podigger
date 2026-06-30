/**
 * T078 — RegisterForm.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/shared/ui";
import { isAppError } from "@/shared/api";
import { useRegisterMutation } from "../hooks/useRegisterMutation";
import type { RegisterInput } from "../types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(schema) });

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
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
        Create account
      </Button>
    </form>
  );
}
