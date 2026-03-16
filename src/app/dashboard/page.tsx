"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { artistTypeLabel, clubBookerTypeLabel, genreOptions } from "./options";
import ArtistInquiryList from "./ArtistInquiryList";
import BookingInquiryList from "./BookingInquiryList";
import { getProfileFallbackFromMock, getSearchResultsFromMock } from "./mock-data";
import {
  getAccountTypeFromSearchParams,
  parseProfileFromSearchParams,
  toRawSearchParams,
  toSearchString,
} from "./profile";

const artistAvailability = [
  "Fri, Mar 27 - Open",
  "Sat, Mar 28 - Open",
  "Thu, Apr 2 - Hold: The Echo Room",
];

const artistInquiries = [
  {
    clubUserId: "club_001",
    note: "Looking for a Friday rock set on Apr 10.",
  },
  {
    clubUserId: "club_002",
    note: "Requested a 45-minute opening slot for a weekend bill.",
  },
  {
    clubUserId: "club_003",
    note: "Interested in a summer residency if dates align.",
  },
];

const clubAvailability = [
  "Fri, Mar 27 - Need Indie/Rock headliner",
  "Sat, Mar 28 - Need Acoustic duo for late set",
  "Thu, Apr 2 - Need opener for touring act",
];

const clubInquiries = [
  {
    artistUserId: "artist_001",
    note: "Sent availability for Fri, Apr 18 and asked for a 45-minute slot.",
  },
  {
    artistUserId: "artist_002",
    note: "Shared EPK and requested consideration for your May lineup.",
  },
  {
    artistUserId: "artist_005",
    note: "Asked to join your summer calendar for weekend support slots.",
  },
];

function DashboardPageContent() {
  const searchParams = useSearchParams();

  const profile = useMemo(() => {
    const raw = toRawSearchParams(new URLSearchParams(searchParams.toString()));
    const accountType = getAccountTypeFromSearchParams(raw);
    const fallback = getProfileFallbackFromMock(accountType);
    return parseProfileFromSearchParams(raw, fallback);
  }, [searchParams]);

  const accountTypeLabel = profile.accountType === "artist" ? "Artist" : "Club / Booker";
  const editHref = `/dashboard/edit?${toSearchString(profile)}`;
  const searchHref = `/dashboard/search?${toSearchString(profile)}`;
  const profileQuery = toSearchString(profile);
  const dashboardReturnTo = `/dashboard?${profileQuery}`;

  const roleName = profile.accountType === "artist" ? "Band Name" : "Venue / Booker Name";
  const roleValue = profile.accountType === "artist" ? profile.bandName : profile.venueName;
  const genreLabels = profile.artistGenres
    .map((genre) => genreOptions.find((option) => option.value === genre)?.label)
    .filter(Boolean)
    .join(", ");
  const clubGenreLabels = profile.clubGenres
    .map((genre) => genreOptions.find((option) => option.value === genre)?.label)
    .filter(Boolean)
    .join(", ");
  const youtubeLinks = profile.youtubeLinks.filter(Boolean);

  const availabilityItems = profile.accountType === "artist" ? artistAvailability : clubAvailability;
  const allClubResults = getSearchResultsFromMock("artist");
  const artistInquiryEntries = artistInquiries
    .map((inquiry) => ({
      note: inquiry.note,
      club: allClubResults.find((club) => club.userId === inquiry.clubUserId),
    }))
    .filter((entry): entry is { note: string; club: (typeof allClubResults)[number] } =>
      Boolean(entry.club),
    );

  const allArtistResults = getSearchResultsFromMock("club-booker");
  const inquiryEntries = clubInquiries
    .map((inquiry) => ({
      note: inquiry.note,
      artist: allArtistResults.find((artist) => artist.userId === inquiry.artistUserId),
    }))
    .filter((entry): entry is { note: string; artist: (typeof allArtistResults)[number] } =>
      Boolean(entry.artist),
    );

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-zinc-400 uppercase">Profile</p>
              <h1 className="mt-2 font-display text-4xl tracking-wider text-white md:text-5xl">
                {profile.realName}
              </h1>
              <p className="mt-2 text-zinc-300">{profile.username}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-secondary" href={searchHref}>
                {profile.accountType === "artist" ? "Search Clubs" : "Search Artists"}
              </Link>
              <Link className="btn-secondary" href={editHref}>
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">Account Type</p>
              <p className="mt-1 font-semibold text-white">{accountTypeLabel}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">User ID</p>
              <p className="mt-1 font-semibold text-white">{profile.userId}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">Email</p>
              <p className="mt-1 font-semibold text-white">{profile.email}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">Location</p>
              <p className="mt-1 font-semibold text-white">{profile.location}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">{roleName}</p>
              <p className="mt-1 font-semibold text-white">{roleValue}</p>
            </div>
            {profile.accountType === "artist" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Artist Type</p>
                <p className="mt-1 font-semibold text-white">{artistTypeLabel(profile.artistType)}</p>
              </div>
            ) : null}
            {profile.accountType === "artist" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
                <p className="text-xs text-zinc-400 uppercase">Music Genres</p>
                <p className="mt-1 font-semibold text-white">{genreLabels || "Not set"}</p>
              </div>
            ) : null}
            {profile.accountType === "artist" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Home City</p>
                <p className="mt-1 font-semibold text-white">{profile.artistHomeCity}</p>
              </div>
            ) : null}
            {profile.accountType === "artist" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Typical Set Length</p>
                <p className="mt-1 font-semibold text-white">{profile.artistSetLength}</p>
              </div>
            ) : null}
            {profile.accountType === "artist" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-zinc-400 uppercase">Artist Description</p>
                <p className="mt-1 font-semibold text-white">{profile.artistDescription}</p>
              </div>
            ) : null}
            {profile.accountType === "artist" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-zinc-400 uppercase">Band Picture URL</p>
                <p className="mt-1 font-semibold text-white">{profile.bandPicUrl || "Not set"}</p>
              </div>
            ) : null}
            {profile.accountType === "artist" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-zinc-400 uppercase">YouTube Links</p>
                {youtubeLinks.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {youtubeLinks.map((link) => (
                      <li key={link}>
                        <a
                          className="text-blue-300 underline decoration-white/30 underline-offset-2 hover:text-blue-200"
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 font-semibold text-white">Not set</p>
                )}
              </div>
            ) : null}
            {profile.accountType === "club-booker" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Club/Booker Type</p>
                <p className="mt-1 font-semibold text-white">{clubBookerTypeLabel(profile.clubBookerType)}</p>
              </div>
            ) : null}
            {profile.accountType === "club-booker" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Venue Capacity</p>
                <p className="mt-1 font-semibold text-white">{profile.venueCapacity}</p>
              </div>
            ) : null}
            {profile.accountType === "club-booker" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Booking Contact Email</p>
                <p className="mt-1 font-semibold text-white">{profile.bookingContactEmail}</p>
              </div>
            ) : null}
            {profile.accountType === "club-booker" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
                <p className="text-xs text-zinc-400 uppercase">Typical Booking Nights</p>
                <p className="mt-1 font-semibold text-white">{profile.typicalBookingNights}</p>
              </div>
            ) : null}
            {profile.accountType === "club-booker" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
                <p className="text-xs text-zinc-400 uppercase">Preferred Genres</p>
                <p className="mt-1 font-semibold text-white">{clubGenreLabels || "Not set"}</p>
              </div>
            ) : null}
            {profile.accountType === "club-booker" ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-zinc-400 uppercase">Notes for Artists</p>
                <p className="mt-1 font-semibold text-white">{profile.artistNotes}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <h2 className="font-display text-3xl tracking-wider text-white">
            {profile.accountType === "artist" ? "Your Availability" : "Open Booking Slots"}
          </h2>
          <ul className="mt-4 space-y-3">
            {availabilityItems.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-zinc-200">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <h2 className="font-display text-3xl tracking-wider text-white">
            {profile.accountType === "artist" ? "Booking Inquiries" : "Artist Inquiries"}
          </h2>
          {profile.accountType === "artist" ? (
            <BookingInquiryList inquiries={artistInquiryEntries} profileQuery={profileQuery} />
          ) : (
            <ArtistInquiryList
              inquiries={inquiryEntries}
              profileQuery={profileQuery}
              returnTo={dashboardReturnTo}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen py-10" />}>
      <DashboardPageContent />
    </Suspense>
  );
}
