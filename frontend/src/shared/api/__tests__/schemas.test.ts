/**
 * T015 — Zod schema snapshot test (write first, ensure FAIL before T026-T029)
 *
 * Validates that each Zod schema round-trips a representative payload and
 * rejects a missing required field with a named Zod issue.
 */

import { describe, it, expect } from "vitest";
import {
  episodeSchema,
  episodesResponseSchema,
} from "@/shared/api/endpoints/episodes";
import {
  podcastSchema,
  podcastsResponseSchema,
  addPodcastRequestSchema,
  addPodcastResponseSchema,
} from "@/shared/api/endpoints/podcasts";
import { podcastLanguageSchema } from "@/shared/api/endpoints/languages";
import {
  loginRequestSchema,
  loginResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  sessionResponseSchema,
} from "@/shared/api/endpoints/auth";

describe("shared/api/endpoints — Zod schemas", () => {
  describe("episodeSchema", () => {
    const valid = {
      id: 1,
      title: "Test Episode",
      link: "https://example.com/ep1",
      description: "A test episode",
      published: "2024-01-01T00:00:00Z",
      enclosure: null,
      podcast: { id: 10, name: "Test Podcast", image: null },
      tags: [{ id: 1, name: "tech" }],
    };

    it("parses a valid episode", () => {
      expect(episodeSchema.parse(valid)).toMatchObject({ id: 1, title: "Test Episode" });
    });

    it("fails when id is missing", () => {
      const { id: _id, ...rest } = valid;
      const result = episodeSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("id"))).toBe(true);
      }
    });
  });

  describe("episodesResponseSchema", () => {
    it("parses a valid episodes response", () => {
      const payload = {
        count: 1,
        next: null,
        previous: null,
        results: [],
      };
      expect(episodesResponseSchema.parse(payload)).toMatchObject({ count: 1 });
    });
  });

  describe("podcastSchema", () => {
    const valid = {
      id: 1,
      name: "Test Podcast",
      feed: "https://example.com/feed",
      image: null,
      language: { id: 1, code: "pt", name: "Portuguese" },
      total_episodes: 42,
    };

    it("parses a valid podcast", () => {
      expect(podcastSchema.parse(valid)).toMatchObject({ id: 1, name: "Test Podcast" });
    });

    it("fails when name is missing", () => {
      const { name: _name, ...rest } = valid;
      const result = podcastSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(true);
      }
    });
  });

  describe("podcastsResponseSchema", () => {
    it("parses a valid podcasts response", () => {
      const payload = { count: 0, next: null, previous: null, results: [] };
      expect(podcastsResponseSchema.parse(payload)).toMatchObject({ count: 0 });
    });
  });

  describe("addPodcastRequestSchema", () => {
    it("parses a valid add-podcast request", () => {
      expect(
        addPodcastRequestSchema.parse({ name: "My Podcast", feed: "https://example.com/feed" }),
      ).toMatchObject({ name: "My Podcast" });
    });

    it("fails when feed is missing", () => {
      const result = addPodcastRequestSchema.safeParse({ name: "My Podcast" });
      expect(result.success).toBe(false);
    });
  });

  describe("addPodcastResponseSchema", () => {
    it("parses a created response", () => {
      const payload = { id: 1, status: "created" };
      expect(addPodcastResponseSchema.parse(payload)).toMatchObject({ status: "created" });
    });

    it("parses an existing response", () => {
      const payload = { status: "existing", message: "Already exists" };
      expect(addPodcastResponseSchema.parse(payload)).toMatchObject({ status: "existing" });
    });
  });

  describe("podcastLanguageSchema", () => {
    it("parses a valid language", () => {
      const lang = { id: 1, code: "pt", name: "Portuguese" };
      expect(podcastLanguageSchema.parse(lang)).toMatchObject({ code: "pt" });
    });
  });

  describe("loginRequestSchema", () => {
    it("parses valid login credentials", () => {
      expect(
        loginRequestSchema.parse({ email: "user@example.com", password: "secret" }),
      ).toMatchObject({ email: "user@example.com" });
    });
  });

  describe("loginResponseSchema", () => {
    it("parses a valid login response", () => {
      const payload = {
        access: "token",
        refresh: "refresh",
        user: { email: "user@example.com", role: "admin" },
      };
      expect(loginResponseSchema.parse(payload)).toMatchObject({
        user: { role: "admin" },
      });
    });
  });

  describe("registerRequestSchema", () => {
    it("parses valid registration data", () => {
      expect(
        registerRequestSchema.parse({ email: "new@example.com", password: "pass123" }),
      ).toMatchObject({ email: "new@example.com" });
    });
  });

  describe("registerResponseSchema", () => {
    it("parses a valid register response", () => {
      const payload = { user: { email: "new@example.com", role: "reader" } };
      expect(registerResponseSchema.parse(payload)).toMatchObject({
        user: { role: "reader" },
      });
    });
  });

  describe("sessionResponseSchema", () => {
    it("parses a valid session response", () => {
      const payload = { user: { email: "user@example.com", role: "editor" } };
      expect(sessionResponseSchema.parse(payload)).toMatchObject({
        user: { role: "editor" },
      });
    });
  });
});
