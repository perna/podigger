/**
 * T084 — AddPodcastForm.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/shared/ui";
import { isAppError } from "@/shared/api";
import { useAddPodcastMutation } from "../hooks/useAddPodcastMutation";
import type { AddPodcastInput } from "../types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  feed: z.string().url("Feed must be a valid URL"),
});

export function AddPodcastForm() {
  const mutation = useAddPodcastMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddPodcastInput>({ resolver: zodResolver(schema) });

  const errorMessage =
    mutation.error && isAppError(mutation.error)
      ? mutation.error.toUserMessage()
      : mutation.error
        ? "Something went wrong."
        : null;

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        try {
          await mutation.mutateAsync(values);
          reset();
        } catch {
          // mutation.error holds the AppError
        }
      })}
      className="flex flex-col gap-4"
    >
      <Input
        label="Podcast name"
        placeholder="My favourite podcast"
        {...register("name")}
        error={errors.name?.message}
      />
      <Input
        label="RSS feed URL"
        placeholder="https://example.com/feed.xml"
        type="url"
        {...register("feed")}
        error={errors.feed?.message}
      />
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      ) : null}
      {mutation.isSuccess && mutation.data ? (
        <p role="status" className="text-sm text-green-500">
          {mutation.data.message ?? "Podcast added successfully."}
        </p>
      ) : null}
      <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
        Add podcast
      </Button>
    </form>
  );
}
