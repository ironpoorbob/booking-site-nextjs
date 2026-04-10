"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ArtistProfileModal from "./ArtistProfileModal";
import type { SearchResult } from "./mock-data";

type ArtistInquiry = {
  artist: SearchResult;
  note: string;
};

type ArtistInquiryListProps = {
  inquiries: ArtistInquiry[];
  profileQuery: string;
  returnTo: string;
};

export default function ArtistInquiryList({ inquiries, profileQuery, returnTo }: ArtistInquiryListProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const selectedInquiry = useMemo(
    () => inquiries.find((entry) => entry.artist.userId === selectedUserId) ?? null,
    [inquiries, selectedUserId],
  );

  const bookingHref = useMemo(() => {
    if (!selectedInquiry) {
      return "";
    }

    const params = new URLSearchParams();
    const profileParams = new URLSearchParams(profileQuery);

    profileParams.forEach((value, key) => {
      params.append(key, value);
    });

    params.set("returnTo", returnTo);

    return `/dashboard/book/${selectedInquiry.artist.userId}?${params.toString()}`;
  }, [profileQuery, returnTo, selectedInquiry]);

  return (
    <>
      <ul className="mt-4 space-y-3">
        {inquiries.map((entry) => (
          <li key={`${entry.artist.userId}-${entry.note}`}>
            <button
              type="button"
              onClick={() => setSelectedUserId(entry.artist.userId)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-zinc-200 transition-colors hover:border-white/30"
            >
              <p className="font-semibold text-zinc-100">{entry.artist.name}</p>
              <p className="mt-1 text-sm text-zinc-300">{entry.note}</p>
            </button>
          </li>
        ))}
      </ul>

      {selectedInquiry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Artist Inquiry</p>
                <h3 className="mt-1 font-display text-4xl tracking-wider text-white">
                  {selectedInquiry.artist.name}
                </h3>
                <p className="mt-1 text-zinc-300">{selectedInquiry.artist.city}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close artist inquiry"
              >
                X
              </button>
            </div>

            <p className="mt-4 text-zinc-200">
              {selectedInquiry.artist.artistDescription || selectedInquiry.artist.summary}
            </p>
            <p className="mt-3 text-sm text-zinc-300">{selectedInquiry.note}</p>
            <p className="mt-2 text-sm text-zinc-400">{selectedInquiry.artist.meta}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link className="btn-primary" href={bookingHref}>
                Book This Artist
              </Link>
              <button
                type="button"
                className="btn-secondary ml-auto"
                onClick={() => setProfileUserId(selectedInquiry.artist.userId)}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {profileUserId ? (
        <ArtistProfileModal
          artistUserId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      ) : null}
    </>
  );
}
