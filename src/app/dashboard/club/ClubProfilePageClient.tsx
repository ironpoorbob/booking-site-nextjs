"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ClubProfilePreview } from "../mock-data";

type ClubProfilePageClientProps = {
  club: ClubProfilePreview;
};

export default function ClubProfilePageClient({ club }: ClubProfilePageClientProps) {
  const searchParams = useSearchParams();

  const effectiveClubPicUrl = useMemo(() => {
    const clubPicUrl = searchParams.get("clubPicUrl");
    return clubPicUrl && clubPicUrl.startsWith("http") ? clubPicUrl : club.clubPicUrl;
  }, [club.clubPicUrl, searchParams]);

  return (
    <>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          {effectiveClubPicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={effectiveClubPicUrl}
              alt={`${club.name} venue`}
              className="h-full max-h-[420px] w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/30 text-sm uppercase tracking-[0.12em] text-zinc-500">
              No venue image yet
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Summary</p>
            <p className="mt-1 text-zinc-200">{club.summary}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Venue Capacity</p>
            <p className="mt-1 text-zinc-200">{club.capacity}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Booking Contact</p>
            {club.email ? (
              <a
                className="mt-2 inline-block break-all text-blue-300 underline decoration-white/30 underline-offset-2 hover:text-blue-200"
                href={`mailto:${club.email}`}
              >
                {club.email}
              </a>
            ) : (
              <p className="mt-1 text-zinc-200">No booking contact listed.</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Typical Booking Nights</p>
            <p className="mt-1 text-zinc-200">Thursday, Friday, Saturday</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
          <p className="text-xs text-zinc-400 uppercase">For Artists</p>
          <p className="mt-1 text-zinc-200">
            Reach out with a short intro, links to live material, and any routing details that help place your act on
            the right bill.
          </p>
        </div>
      </div>
    </>
  );
}
