"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ArtistProfileModal from "../ArtistProfileModal";
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

  function buildBookingHref(selectedArtist: SearchResult): string {
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
  }

  const selectedArtist = useMemo(
    () => results.find((result) => result.userId === selectedUserId) ?? null,
    [results, selectedUserId],
  );

  return (
    <>
      <div className="mt-4 grid gap-3">
        {results.length > 0 ? (
          results.map((result) => (
            <article
              key={`${result.userId}-${result.name}`}
              className="rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:border-white/30"
            >
              <p className="font-semibold text-white">{result.name}</p>
              <p className="mt-1 text-zinc-300">{result.city}</p>
              <p className="mt-2 text-zinc-200">{result.summary}</p>
              {result.artistDescription ? (
                <p className="mt-3 text-sm text-zinc-300">{result.artistDescription}</p>
              ) : null}
              <p className="mt-2 text-sm text-zinc-400">{result.meta}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedUserId(result.userId)}
                >
                  View Profile
                </button>
                <Link className="btn-primary" href={buildBookingHref(result)}>
                  Send Booking Request
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="text-zinc-300">No matches found for this query.</p>
        )}
      </div>

      {selectedArtist ? (
        <ArtistProfileModal
          artistUserId={selectedArtist.userId}
          onClose={() => setSelectedUserId(null)}
        />
      ) : null}
    </>
  );
}
