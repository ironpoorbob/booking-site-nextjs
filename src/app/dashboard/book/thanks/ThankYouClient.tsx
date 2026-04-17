"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

function formatShowDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value || "the requested date";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatShowTime(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return value || "TBD";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) {
    return value || "TBD";
  }

  const base = new Date();
  base.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(base);
}

export default function ThankYouClient() {
  const searchParams = useSearchParams();

  const requestType = searchParams.get("requestType")?.trim() || "artist";
  const artistName = searchParams.get("artistName")?.trim() || "this artist";
  const clubName = searchParams.get("clubName")?.trim() || "your club";
  const showDate = formatShowDate(searchParams.get("showDate")?.trim() ?? "");
  const setTime = searchParams.get("setInfo")?.trim() || formatShowTime(searchParams.get("showTime")?.trim() ?? "");
  const isClubRequest = requestType === "club";

  const returnTo = useMemo(() => {
    const value = searchParams.get("returnTo");
    if (value && value.startsWith("/")) {
      return value;
    }

    return "/dashboard/search?accountType=club-booker";
  }, [searchParams]);
  const dashboardHref = useMemo(() => {
    const returnToRaw = searchParams.get("returnTo");

    if (returnToRaw?.startsWith("/dashboard?")) {
      return returnToRaw;
    }

    return `/dashboard?${searchParams.toString()}`;
  }, [searchParams]);

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
        <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Booking Request Sent</p>
        <h1 className="mt-2 font-display text-5xl tracking-wider text-white">Thank You</h1>
        <p className="mt-4 text-zinc-200">
          {isClubRequest
            ? "Your booking request has been submitted. The club can review your request and respond with next steps."
            : "Your booking request has been submitted. An email will come with the band contact information."}
        </p>
        <p className="mt-3 text-zinc-200">
          {isClubRequest
            ? `You've requested a booking opportunity with ${clubName} for ${showDate}. Requested need: ${setTime}. Artist: ${artistName}.`
            : `You've requested to book ${artistName} at ${clubName} on ${showDate}. Set time will be ${setTime}.`}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-secondary" href={returnTo}>
            Back to Search Results
          </Link>
          <Link className="btn-primary" href={dashboardHref}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
