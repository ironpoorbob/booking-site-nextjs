"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { SearchResult } from "../mock-data";

type ArtistSearchResultsProps = {
  results: SearchResult[];
  profileQuery: string;
};

export default function ArtistSearchResults({ results, profileQuery }: ArtistSearchResultsProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showDate = searchParams.get("showDate") ?? "";
  const showTime = searchParams.get("showTime") ?? "";

  const returnTo = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const selectedArtist = useMemo(
    () => results.find((result) => result.userId === selectedUserId) ?? null,
    [results, selectedUserId],
  );

  const bookingHref = useMemo(() => {
    if (!selectedArtist) {
      return "";
    }

    const params = new URLSearchParams();
    const profileParams = new URLSearchParams(profileQuery);
    const clubName = profileParams.get("venueName") ?? "your club";
    params.set("returnTo", returnTo);
    params.set("requestType", "artist");
    params.set("artistName", selectedArtist.name);
    params.set("clubName", clubName);

    if (showDate) {
      params.set("showDate", showDate);
    }

    if (showTime) {
      params.set("showTime", showTime);
    }

    return `/dashboard/book/thanks?${params.toString()}`;
  }, [profileQuery, returnTo, selectedArtist, showDate, showTime]);

  return (
    <>
      <div className="mt-4 grid gap-3">
        {results.length > 0 ? (
          results.map((result) => (
            <button
              key={`${result.userId}-${result.name}`}
              type="button"
              onClick={() => setSelectedUserId(result.userId)}
              className="rounded-xl border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-white/30"
            >
              <p className="font-semibold text-white">{result.name}</p>
              <p className="mt-1 text-zinc-300">{result.city}</p>
              <p className="mt-2 text-zinc-200">{result.summary}</p>
              <p className="mt-2 text-sm text-zinc-400">{result.meta}</p>
            </button>
          ))
        ) : (
          <p className="text-zinc-300">No matches found for this query.</p>
        )}
      </div>

      {selectedArtist ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Artist Preview</p>
                <h3 className="mt-1 font-display text-4xl tracking-wider text-white">{selectedArtist.name}</h3>
                <p className="mt-1 text-zinc-300">{selectedArtist.city}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close artist preview"
              >
                X
              </button>
            </div>

            <p className="mt-4 text-zinc-200">{selectedArtist.artistDescription || selectedArtist.summary}</p>
            <p className="mt-3 text-sm text-zinc-400">{selectedArtist.meta}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link className="btn-secondary" href={`/dashboard/artist/${selectedArtist.userId}`}>
                View Profile
              </Link>
              <Link className="btn-primary ml-auto" href={bookingHref}>
                Send Booking Request
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
