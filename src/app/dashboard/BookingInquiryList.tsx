"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchResult } from "./mock-data";

type BookingInquiry = {
  club: SearchResult;
  note: string;
};

type BookingInquiryListProps = {
  inquiries: BookingInquiry[];
  profileQuery: string;
};

export default function BookingInquiryList({ inquiries, profileQuery }: BookingInquiryListProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedInquiry = useMemo(
    () => inquiries.find((entry) => entry.club.userId === selectedUserId) ?? null,
    [inquiries, selectedUserId],
  );

  const searchHref = `/dashboard/search?${profileQuery}`;

  return (
    <>
      <ul className="mt-4 space-y-3">
        {inquiries.map((entry) => (
          <li key={`${entry.club.userId}-${entry.note}`}>
            <button
              type="button"
              onClick={() => setSelectedUserId(entry.club.userId)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-zinc-200 transition-colors hover:border-white/30"
            >
              <p className="font-semibold text-zinc-100">{entry.club.name}</p>
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
                <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Booking Inquiry</p>
                <h3 className="mt-1 font-display text-4xl tracking-wider text-white">
                  {selectedInquiry.club.name}
                </h3>
                <p className="mt-1 text-zinc-300">{selectedInquiry.club.city}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-md border border-white/25 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-zinc-200">{selectedInquiry.club.summary}</p>
            <p className="mt-3 text-sm text-zinc-300">{selectedInquiry.note}</p>
            <p className="mt-2 text-sm text-zinc-400">{selectedInquiry.club.meta}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link className="btn-primary" href={searchHref}>
                Search Clubs
              </Link>
              <Link className="btn-secondary ml-auto" href={`/dashboard/club/${selectedInquiry.club.userId}`}>
                View Profile
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
