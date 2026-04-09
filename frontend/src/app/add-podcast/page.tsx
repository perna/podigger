"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPodcast } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";

export default function AddPodcastPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [feed, setFeed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await addPodcast(name, feed);
      if (response.status === "created") {
        setSuccess("Podcast added successfully! We are syncing the episodes.");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else if (response.status === "existing") {
        setSuccess("This podcast was already in our library.");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(response.message || "An error occurred.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to add podcast. Please check the URL.");
      } else {
        setError("Failed to add podcast. Please check the URL.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center p-4 font-display">
      <div className="relative w-full max-w-[420px] bg-[#121212] shadow-2xl overflow-hidden rounded-[3rem] flex flex-col border-[8px] border-[#2a2a2a] min-h-[800px]">
        {/* iOS-like header area */}
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
          >
            <Icon name="arrow_back_ios_new" />
          </button>
          <h2 className="text-zinc-300 text-base font-semibold">Registration</h2>
          <button className="text-zinc-400 hover:text-yellow-400 transition-colors flex items-center justify-center size-10 rounded-full bg-[#252525]">
            <Icon name="dark_mode" />
          </button>
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col px-6 justify-center mt-4">
          <div className="flex justify-center mb-8">
            <div className="size-20 bg-[#0db9f2]/15 rounded-2xl flex items-center justify-center ring-1 ring-[#0db9f2]/30 text-[#0db9f2]">
              <Icon name="podcasts" className="text-5xl" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-white tracking-tight text-3xl font-extrabold leading-tight">
              Add a New Podcast
            </h1>
            <p className="text-zinc-400 text-base mt-3 px-4">
              Connect your favorite creator by entering their unique RSS feed link.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[#1E1E1E] border border-white/10 p-6 rounded-lg space-y-6 shadow-xl"
          >
            <div className="space-y-2">
              <label className="block text-zinc-100 text-xs font-bold ml-1 uppercase tracking-widest">
                Podcast Name
              </label>
              <div className="relative">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input flex w-full rounded-xl text-white caret-[#0db9f2] focus:outline-0 focus:ring-2 focus:ring-[#0db9f2]/40 border border-zinc-700 bg-[#252525] h-14 placeholder:text-zinc-500 px-5 py-4 text-base font-normal leading-normal transition-all"
                  placeholder="The Joe Rogan Experience"
                  type="text"
                  disabled={isLoading || !!success}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 flex">
                  <Icon name="mic" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-zinc-100 text-xs font-bold ml-1 uppercase tracking-widest">
                RSS Feed URL
              </label>
              <div className="relative">
                <input
                  required
                  value={feed}
                  onChange={(e) => setFeed(e.target.value)}
                  className="form-input flex w-full rounded-xl text-white caret-[#0db9f2] focus:outline-0 focus:ring-2 focus:ring-[#0db9f2]/40 border border-zinc-700 bg-[#252525] h-14 placeholder:text-zinc-500 px-5 py-4 text-base font-normal leading-normal transition-all"
                  placeholder="https://feed.url/rss"
                  type="url"
                  disabled={isLoading || !!success}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 flex">
                  <Icon name="link" />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm mt-2 font-medium break-words text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-400 text-sm mt-2 font-medium break-words text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full h-14 bg-[#0db9f2] hover:bg-[#0db9f2]/90 disabled:bg-zinc-600 disabled:text-zinc-400 text-black font-extrabold text-lg rounded-xl shadow-lg shadow-[#0db9f2]/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{isLoading ? "Adding..." : success ? "Added!" : "Add to Podigger"}</span>
              {!isLoading && !success && (
                <div className="group-hover:translate-x-1 transition-transform flex">
                  <Icon name="arrow_forward" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-3 px-2">
            <div className="text-[#0db9f2] shrink-0 text-xl flex">
              <Icon name="info" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Once added, Podigger will scan the feed and automatically sync all
              episodes to your library. This may take a few seconds.
            </p>
          </div>
        </div>

        <div className="py-8 flex flex-col items-center mt-auto">
          <button
            onClick={() => router.push("/")}
            disabled={isLoading}
            className="text-zinc-500 font-semibold hover:text-white transition-colors"
          >
            Cancel and return
          </button>
          <div className="mt-6 w-32 h-1.5 bg-zinc-800 rounded-full"></div>
        </div>
      </div>

      <div className="fixed -top-24 -left-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[#0db9f2]/5 rounded-full blur-[120px] -z-10"></div>
    </div>
  );
}
