"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { getSearchResultsFromMock } from "./dashboard/mock-data";

const CLUB_ONBOARDING_STORAGE_KEY = "bookemdanno.clubOnboardingDraft";
const ARTIST_ONBOARDING_STORAGE_KEY = "bookemdanno.artistOnboardingDraft";
const CLUB_CAPACITY_OPTIONS = [
  "Under 100",
  "100 - 199",
  "200 - 349",
  "350 - 499",
  "500+",
] as const;
const CLUB_ROOM_TYPES = [
  "Bar / Club",
  "Listening Room",
  "Restaurant / Patio",
  "Private Event Space",
  "DIY / Community Room",
] as const;
const CLUB_GENRES = [
  "Rock",
  "Alternative / Indie",
  "Punk",
  "Pop",
  "Jazz",
  "Country",
  "Electronic / DJ",
] as const;
const CLUB_BOOKING_DAYS = ["Thursday", "Friday", "Saturday", "Sunday", "Weeknights"] as const;
const CLUB_FORMATS = ["Original music", "Covers", "DJs", "Acoustic / stripped-down sets"] as const;
const ARTIST_FORMATS = [
  "Full band",
  "Solo acoustic",
  "Duo / Trio",
  "DJ set",
  "Stripped-down set",
] as const;
const ARTIST_GENRES = [
  "Rock",
  "Alternative / Indie",
  "Punk",
  "Pop",
  "Jazz",
  "Country",
  "Electronic / DJ",
] as const;
const ARTIST_SET_LENGTHS = ["30 minutes", "45 minutes", "60 minutes", "75+ minutes"] as const;
const ARTIST_BEST_FOR = [
  "Late-night crowds",
  "Patio sets",
  "Brunch",
  "Ticketed rooms",
  "Private events",
  "College audiences",
] as const;

type ClubOnboardingDraft = {
  city: string;
  capacity: string;
  genres: string[];
  roomType: string;
  bookingDays: string[];
  formats: string[];
};

type ArtistOnboardingDraft = {
  city: string;
  format: string;
  genres: string[];
  setLength: string;
  bestFor: string[];
};

const emptyClubDraft: ClubOnboardingDraft = {
  city: "",
  capacity: "",
  genres: [],
  roomType: "",
  bookingDays: [],
  formats: [],
};

const emptyArtistDraft: ArtistOnboardingDraft = {
  city: "",
  format: "",
  genres: [],
  setLength: "",
  bestFor: [],
};

function readStoredClubDraft(): ClubOnboardingDraft {
  try {
    const stored = window.localStorage.getItem(CLUB_ONBOARDING_STORAGE_KEY);

    if (!stored) {
      return emptyClubDraft;
    }

    const parsed = JSON.parse(stored) as Partial<ClubOnboardingDraft>;

    return {
      city: parsed.city ?? "",
      capacity: parsed.capacity ?? "",
      genres: Array.isArray(parsed.genres) ? parsed.genres : [],
      roomType: parsed.roomType ?? "",
      bookingDays: Array.isArray(parsed.bookingDays) ? parsed.bookingDays : [],
      formats: Array.isArray(parsed.formats) ? parsed.formats : [],
    };
  } catch {
    window.localStorage.removeItem(CLUB_ONBOARDING_STORAGE_KEY);
    return emptyClubDraft;
  }
}

function readStoredArtistDraft(): ArtistOnboardingDraft {
  try {
    const stored = window.localStorage.getItem(ARTIST_ONBOARDING_STORAGE_KEY);

    if (!stored) {
      return emptyArtistDraft;
    }

    const parsed = JSON.parse(stored) as Partial<ArtistOnboardingDraft>;

    return {
      city: parsed.city ?? "",
      format: parsed.format ?? "",
      genres: Array.isArray(parsed.genres) ? parsed.genres : [],
      setLength: parsed.setLength ?? "",
      bestFor: Array.isArray(parsed.bestFor) ? parsed.bestFor : [],
    };
  } catch {
    window.localStorage.removeItem(ARTIST_ONBOARDING_STORAGE_KEY);
    return emptyArtistDraft;
  }
}

function StepLabel({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">
      Step {current} of {total}
    </p>
  );
}

export default function HomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow") ?? "";
  const [isArtistWizardOpen, setIsArtistWizardOpen] = useState(false);
  const [isClubWizardOpen, setIsClubWizardOpen] = useState(false);
  const [isArtistMatchesOpen, setIsArtistMatchesOpen] = useState(false);
  const [isMatchesOpen, setIsMatchesOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [artistStep, setArtistStep] = useState(0);
  const [clubDraft, setClubDraft] = useState<ClubOnboardingDraft>(emptyClubDraft);
  const [artistDraft, setArtistDraft] = useState<ArtistOnboardingDraft>(emptyArtistDraft);

  function persistDraft(nextDraft: ClubOnboardingDraft) {
    setClubDraft(nextDraft);
    window.localStorage.setItem(CLUB_ONBOARDING_STORAGE_KEY, JSON.stringify(nextDraft));
  }

  function toggleMultiValue(field: "genres" | "bookingDays" | "formats", value: string) {
    const currentValues = clubDraft[field];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    persistDraft({
      ...clubDraft,
      [field]: nextValues,
    });
  }

  function persistArtistDraft(nextDraft: ArtistOnboardingDraft) {
    setArtistDraft(nextDraft);
    window.localStorage.setItem(ARTIST_ONBOARDING_STORAGE_KEY, JSON.stringify(nextDraft));
  }

  function toggleArtistMultiValue(field: "genres" | "bestFor", value: string) {
    const currentValues = artistDraft[field];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    persistArtistDraft({
      ...artistDraft,
      [field]: nextValues,
    });
  }

  function submitClubDraft() {
    window.localStorage.setItem(CLUB_ONBOARDING_STORAGE_KEY, JSON.stringify(clubDraft));
    setIsClubWizardOpen(false);
    router.push("/signup?accountType=club-booker");
  }

  function submitArtistDraft() {
    window.localStorage.setItem(ARTIST_ONBOARDING_STORAGE_KEY, JSON.stringify(artistDraft));
    setIsArtistWizardOpen(false);
    router.push("/signup?accountType=artist");
  }

  function openMatchesPreview() {
    window.localStorage.setItem(CLUB_ONBOARDING_STORAGE_KEY, JSON.stringify(clubDraft));
    setIsClubWizardOpen(false);
    setIsMatchesOpen(true);
  }

  function openArtistMatchesPreview() {
    window.localStorage.setItem(ARTIST_ONBOARDING_STORAGE_KEY, JSON.stringify(artistDraft));
    setIsArtistWizardOpen(false);
    setIsArtistMatchesOpen(true);
  }

  function openClubWizard() {
    setClubDraft(readStoredClubDraft());
    setCurrentStep(0);
    setIsClubWizardOpen(true);
  }

  function openArtistWizard() {
    setArtistDraft(readStoredArtistDraft());
    setArtistStep(0);
    setIsArtistWizardOpen(true);
  }

  const totalSteps = 5;
  const artistTotalSteps = 5;
  const canContinueFromStep =
    (currentStep === 0 && Boolean(clubDraft.city.trim())) ||
    (currentStep === 1 && Boolean(clubDraft.capacity)) ||
    (currentStep === 2 && clubDraft.genres.length > 0) ||
    (currentStep === 3 && Boolean(clubDraft.roomType)) ||
    (currentStep === 4 && clubDraft.bookingDays.length > 0 && clubDraft.formats.length > 0);
  const canContinueArtistStep =
    (artistStep === 0 && Boolean(artistDraft.city.trim())) ||
    (artistStep === 1 && Boolean(artistDraft.format)) ||
    (artistStep === 2 && artistDraft.genres.length > 0) ||
    (artistStep === 3 && Boolean(artistDraft.setLength)) ||
    (artistStep === 4 && artistDraft.bestFor.length > 0);

  const normalizedArtistGenres = artistDraft.genres.map((genre) => {
    if (genre === "Alternative / Indie") {
      return "alternative-indie";
    }
    if (genre === "Electronic / DJ") {
      return "electronic-edm";
    }

    return genre.toLowerCase().replaceAll(" / ", "-").replaceAll(" ", "-");
  });
  const artistMatches = getSearchResultsFromMock("club-booker")
    .filter((artist) => {
      const cityMatch =
        !clubDraft.city.trim() || artist.city.toLowerCase().includes(clubDraft.city.trim().toLowerCase());
      const genreMatch =
        clubDraft.genres.length === 0 ||
        (artist.genres ?? []).some((genre) =>
          clubDraft.genres.some((selectedGenre) => {
            if (selectedGenre === "Alternative / Indie") {
              return genre === "alternative-indie";
            }
            if (selectedGenre === "Electronic / DJ") {
              return genre === "electronic-edm";
            }

            return genre === selectedGenre.toLowerCase().replaceAll(" / ", "-").replaceAll(" ", "-");
          }),
        );

      return cityMatch || genreMatch;
    })
    .slice(0, 8);
  const clubMatches = getSearchResultsFromMock("artist")
    .filter((club) => {
      const cityMatch =
        !artistDraft.city.trim() || club.city.toLowerCase().includes(artistDraft.city.trim().toLowerCase());
      const genreMatch =
        normalizedArtistGenres.length === 0 ||
        (club.availableDates ?? []).some((need) =>
          normalizedArtistGenres.some((genre) => need.lookingFor.toLowerCase().includes(genre.replaceAll("-", " "))),
        ) ||
        normalizedArtistGenres.some((genre) => club.summary.toLowerCase().includes(genre.replaceAll("-", " ")));

      return cityMatch || genreMatch;
    })
    .slice(0, 8);

  if (flow === "booking") {
    return (
      <>
        <header className="site-nav-wrap">
          <nav className="site-nav w-full">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between py-2">
              <Link className="site-brand" href="/">
                <Image
                  src={withBasePath("/book-em-danno-logo.png")}
                  alt="Book 'em, Danno! logo"
                  width={260}
                  height={173}
                  className="h-auto w-40"
                  priority
                />
              </Link>
              <div className="flex items-center gap-2">
                <Link className="site-nav-link" href="/signup">
                  Sign Up
                </Link>
                <Link className="site-nav-link" href="/login">
                  Log In
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="min-h-screen px-6 pt-16 pb-16">
          <div className="mx-auto flex w-full max-w-4xl justify-center">
            <section className="w-full py-16 text-center md:py-24">
              <p className="mx-auto max-w-2xl text-lg text-zinc-200 md:text-xl">
                Looking for a band to play your club, or trying to book your next show at a venue?
                Start in the direction that fits your role.
              </p>
              <h1 className="mt-8 font-display text-6xl tracking-wider text-white md:text-8xl">
                Get Booking
              </h1>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={openArtistWizard}
                >
                  Look for Clubs
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={openClubWizard}
                >
                  Look for Artists
                </button>
              </div>
            </section>
          </div>
        </main>

        {isClubWizardOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-zinc-950 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <StepLabel current={currentStep + 1} total={totalSteps} />
                  <h2 className="mt-2 font-display text-4xl tracking-wider text-white">Venue Setup</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClubWizardOpen(false)}
                  className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close venue setup"
                >
                  X
                </button>
              </div>

              {currentStep === 0 ? (
                <div className="mt-8">
                  <label className="form-group">
                    <span>What city is your venue?</span>
                    <input
                      className="form-input"
                      type="text"
                      value={clubDraft.city}
                      onChange={(event) =>
                        persistDraft({
                          ...clubDraft,
                          city: event.target.value,
                        })
                      }
                      placeholder="Los Angeles"
                    />
                  </label>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="mt-8">
                  <p className="mb-4 text-lg font-semibold text-white">How big is your club?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CLUB_CAPACITY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          persistDraft({
                            ...clubDraft,
                            capacity: option,
                          })
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          clubDraft.capacity === option
                            ? "border-white/60 bg-white/10 text-white"
                            : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="mt-8">
                  <p className="mb-4 text-lg font-semibold text-white">What kind of music do you typically book?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CLUB_GENRES.map((option) => (
                      <label
                        key={option}
                        className={`rounded-xl border px-4 py-3 transition-colors ${
                          clubDraft.genres.includes(option)
                            ? "border-white/60 bg-white/10 text-white"
                            : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                        }`}
                      >
                        <input
                          className="mr-2"
                          type="checkbox"
                          checked={clubDraft.genres.includes(option)}
                          onChange={() => toggleMultiValue("genres", option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="mt-8">
                  <p className="mb-4 text-lg font-semibold text-white">What kind of room are you booking for?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CLUB_ROOM_TYPES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          persistDraft({
                            ...clubDraft,
                            roomType: option,
                          })
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          clubDraft.roomType === option
                            ? "border-white/60 bg-white/10 text-white"
                            : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="mt-8 space-y-8">
                  <div>
                    <p className="mb-4 text-lg font-semibold text-white">Which nights do you usually book?</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CLUB_BOOKING_DAYS.map((option) => (
                        <label
                          key={option}
                          className={`rounded-xl border px-4 py-3 transition-colors ${
                            clubDraft.bookingDays.includes(option)
                              ? "border-white/60 bg-white/10 text-white"
                              : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                          }`}
                        >
                          <input
                            className="mr-2"
                            type="checkbox"
                            checked={clubDraft.bookingDays.includes(option)}
                            onChange={() => toggleMultiValue("bookingDays", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-4 text-lg font-semibold text-white">What formats are welcome?</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CLUB_FORMATS.map((option) => (
                        <label
                          key={option}
                          className={`rounded-xl border px-4 py-3 transition-colors ${
                            clubDraft.formats.includes(option)
                              ? "border-white/60 bg-white/10 text-white"
                              : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                          }`}
                        >
                          <input
                            className="mr-2"
                            type="checkbox"
                            checked={clubDraft.formats.includes(option)}
                            onChange={() => toggleMultiValue("formats", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                  className="btn-secondary"
                  disabled={currentStep === 0}
                >
                  Back
                </button>

                {currentStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((step) => Math.min(step + 1, totalSteps - 1))}
                    className="btn-primary"
                    disabled={!canContinueFromStep}
                  >
                    Continue
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={openMatchesPreview}
                      className="btn-primary"
                      disabled={!canContinueFromStep}
                    >
                      See Matches
                    </button>
                    <button
                      type="button"
                      onClick={submitClubDraft}
                      className="btn-secondary"
                      disabled={!canContinueFromStep}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {isArtistWizardOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-zinc-950 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <StepLabel current={artistStep + 1} total={artistTotalSteps} />
                  <h2 className="mt-2 font-display text-4xl tracking-wider text-white">Artist Setup</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArtistWizardOpen(false)}
                  className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close artist setup"
                >
                  X
                </button>
              </div>

              {artistStep === 0 ? (
                <div className="mt-8">
                  <label className="form-group">
                    <span>What city are you based in?</span>
                    <input
                      className="form-input"
                      type="text"
                      value={artistDraft.city}
                      onChange={(event) =>
                        persistArtistDraft({
                          ...artistDraft,
                          city: event.target.value,
                        })
                      }
                      placeholder="San Francisco"
                    />
                  </label>
                </div>
              ) : null}

              {artistStep === 1 ? (
                <div className="mt-8">
                  <p className="mb-4 text-lg font-semibold text-white">What performance format do you offer?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ARTIST_FORMATS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          persistArtistDraft({
                            ...artistDraft,
                            format: option,
                          })
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          artistDraft.format === option
                            ? "border-white/60 bg-white/10 text-white"
                            : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {artistStep === 2 ? (
                <div className="mt-8">
                  <p className="mb-4 text-lg font-semibold text-white">What kind of music do you play?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ARTIST_GENRES.map((option) => (
                      <label
                        key={option}
                        className={`rounded-xl border px-4 py-3 transition-colors ${
                          artistDraft.genres.includes(option)
                            ? "border-white/60 bg-white/10 text-white"
                            : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                        }`}
                      >
                        <input
                          className="mr-2"
                          type="checkbox"
                          checked={artistDraft.genres.includes(option)}
                          onChange={() => toggleArtistMultiValue("genres", option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {artistStep === 3 ? (
                <div className="mt-8">
                  <p className="mb-4 text-lg font-semibold text-white">What is your typical set length?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ARTIST_SET_LENGTHS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          persistArtistDraft({
                            ...artistDraft,
                            setLength: option,
                          })
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          artistDraft.setLength === option
                            ? "border-white/60 bg-white/10 text-white"
                            : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {artistStep === 4 ? (
                <div className="mt-8">
                  <p className="mb-4 text-lg font-semibold text-white">What kinds of rooms are you best for?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ARTIST_BEST_FOR.map((option) => (
                      <label
                        key={option}
                        className={`rounded-xl border px-4 py-3 transition-colors ${
                          artistDraft.bestFor.includes(option)
                            ? "border-white/60 bg-white/10 text-white"
                            : "border-white/15 bg-black/40 text-zinc-200 hover:border-white/30"
                        }`}
                      >
                        <input
                          className="mr-2"
                          type="checkbox"
                          checked={artistDraft.bestFor.includes(option)}
                          onChange={() => toggleArtistMultiValue("bestFor", option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setArtistStep((step) => Math.max(step - 1, 0))}
                  className="btn-secondary"
                  disabled={artistStep === 0}
                >
                  Back
                </button>

                {artistStep < artistTotalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={() => setArtistStep((step) => Math.min(step + 1, artistTotalSteps - 1))}
                    className="btn-primary"
                    disabled={!canContinueArtistStep}
                  >
                    Continue
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={openArtistMatchesPreview}
                      className="btn-primary"
                      disabled={!canContinueArtistStep}
                    >
                      See Matches
                    </button>
                    <button
                      type="button"
                      onClick={submitArtistDraft}
                      className="btn-secondary"
                      disabled={!canContinueArtistStep}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {isMatchesOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-zinc-950 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Instant Matches</p>
                  <h2 className="mt-2 font-display text-4xl tracking-wider text-white">
                    You have {artistMatches.length} artist matches
                  </h2>
                  <p className="mt-3 text-zinc-300">
                    Sign up to see who they are, unlock contact details, and start reaching out.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMatchesOpen(false)}
                  className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close instant matches"
                >
                  X
                </button>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
                <p className="font-display text-6xl tracking-wider text-white">{artistMatches.length}</p>
                <p className="mt-2 text-zinc-300">Artists matched to your venue setup</p>
                <p className="mt-4 text-sm text-zinc-400">
                  Create an account to reveal names, emails, genres, and booking actions.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMatchesOpen(false);
                    setIsClubWizardOpen(true);
                    setCurrentStep(totalSteps - 1);
                  }}
                  className="btn-secondary"
                >
                  Back to Setup
                </button>
                <button type="button" onClick={submitClubDraft} className="btn-primary">
                  Sign Up to Unlock Contact Info
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isArtistMatchesOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-zinc-950 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Instant Matches</p>
                  <h2 className="mt-2 font-display text-4xl tracking-wider text-white">
                    You have {clubMatches.length} club matches
                  </h2>
                  <p className="mt-3 text-zinc-300">
                    Sign up to see venues, unlock booking contacts, and start sending requests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArtistMatchesOpen(false)}
                  className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close artist instant matches"
                >
                  X
                </button>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
                <p className="font-display text-6xl tracking-wider text-white">{clubMatches.length}</p>
                <p className="mt-2 text-zinc-300">Clubs matched to your artist setup</p>
                <p className="mt-4 text-sm text-zinc-400">
                  Create an account to reveal venue names, booking contacts, and available dates.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsArtistMatchesOpen(false);
                    setIsArtistWizardOpen(true);
                    setArtistStep(artistTotalSteps - 1);
                  }}
                  className="btn-secondary"
                >
                  Back to Setup
                </button>
                <button type="button" onClick={submitArtistDraft} className="btn-primary">
                  Sign Up to Unlock Clubs
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <main className="min-h-screen px-6 pt-[40px] pb-16">
      <div className="mx-auto flex w-full max-w-4xl justify-center">
        <section className="w-full rounded-3xl border border-white/15 bg-black/80 p-8 shadow-2xl md:p-10">
          <div className="flex flex-col items-center space-y-8 text-center">
            <Image
              src={withBasePath("/book-em-danno-logo.png")}
              alt="Book 'em, Danno! logo"
              width={520}
              height={347}
              className="h-auto w-72 md:w-[28rem]"
              priority
            />
            <p className="max-w-xl text-lg text-zinc-200 md:text-xl">
              Clubs and bookers connect with artists and musicians to fill stages, build nights,
              and keep the crowd moving.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link className="btn-primary" href="/signup">
                Sign Up
              </Link>
              <Link className="btn-secondary" href="/login">
                Log In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
