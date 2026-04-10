"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { getClubBillingIdentifier, getClubBillingStorageKey } from "../billing";
import ArtistProfileModal from "./ArtistProfileModal";
import { artistTypeLabel } from "./options";
import ArtistInquiryList from "./ArtistInquiryList";
import BookingInquiryList from "./BookingInquiryList";
import { getProfileFallbackFromMock, getSearchResultsFromMock } from "./mock-data";
import {
  getAccountTypeFromSearchParams,
  parseProfileFromSearchParams,
  toRawSearchParams,
  toSearchString,
} from "./profile";

type CalendarStatus = "open" | "hold" | "booked" | "need";

type CalendarEntry = {
  date: string;
  status: CalendarStatus;
  title: string;
  detail: string;
  lineup?: string[];
  slotsNeeded?: number;
  venueInfo?: {
    name: string;
    address: string;
    phone: string;
    contactName: string;
    contactEmail: string;
    loadInTime: string;
    soundcheckTime: string;
    setTime: string;
    specialInstructions: string;
  };
};

type CalendarOverride = {
  date: string;
  status?: CalendarStatus;
  title?: string;
  detail?: string;
  cleared?: boolean;
};

const artistAvailability: CalendarEntry[] = [
  {
    date: "2026-04-02",
    status: "open",
    title: "Open",
    detail: "Available for a 45 minute set and actively looking for a confirmation.",
  },
  {
    date: "2026-04-10",
    status: "open",
    title: "Open",
    detail: "Available for local club shows or support slots.",
  },
  {
    date: "2026-04-18",
    status: "booked",
    title: "Booked",
    detail: "Private event in Oakland with load-in at 6:00 PM.",
    venueInfo: {
      name: "Thee Stork Club",
      address: "2330 Telegraph Ave, Oakland, CA 94612",
      phone: "(510) 555-0118",
      contactName: "Maya Ortiz",
      contactEmail: "bookings@theestorkclub.com",
      loadInTime: "6:00 PM",
      soundcheckTime: "6:45 PM",
      setTime: "9:15 PM",
      specialInstructions:
        "Street parking is limited. Keep stage volume controlled after 10 PM and bring your own drum breakables.",
    },
  },
  {
    date: "2026-04-24",
    status: "open",
    title: "Open",
    detail: "Open for Bay Area weekend bookings.",
  },
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

const clubAvailability: CalendarEntry[] = [
  {
    date: "2026-04-03",
    status: "need",
    title: "2 of 3 bands booked",
    detail: "Looking for one more indie/rock headliner to complete the bill.",
    lineup: ["The Not Yetis", "Chrome Deluxe"],
    slotsNeeded: 1,
  },
  {
    date: "2026-04-11",
    status: "need",
    title: "1 of 3 bands booked",
    detail: "Touring package confirmed, need two local openers to round out the night.",
    lineup: ["Kingdom First"],
    slotsNeeded: 2,
  },
  {
    date: "2026-04-18",
    status: "booked",
    title: "Full bill booked",
    detail: "Three-band lineup locked in and ready to promote.",
    lineup: ["Carlos", "Bob Sled", "Clark Nova"],
    slotsNeeded: 0,
  },
  {
    date: "2026-04-25",
    status: "need",
    title: "2 of 3 bands booked",
    detail: "Seeking one late-night punk or alternative band to close the bill.",
    lineup: ["Midnight Static", "Osees"],
    slotsNeeded: 1,
  },
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

function getCalendarStorageKey(accountType: "artist" | "club-booker", userId: string): string {
  return `bookemdanno.calendar.${accountType}.${userId}`;
}

function readStoredCalendarEntries(
  accountType: "artist" | "club-booker",
  userId: string,
): CalendarOverride[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(getCalendarStorageKey(accountType, userId));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CalendarOverride[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredCalendarEntries(
  accountType: "artist" | "club-booker",
  userId: string,
  entries: CalendarOverride[],
): void {
  window.localStorage.setItem(getCalendarStorageKey(accountType, userId), JSON.stringify(entries));
}

function formatCalendarHeader(dateString: string): string {
  const parsed = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function shiftMonth(dateString: string, monthOffset: number): string {
  const parsed = new Date(`${dateString}T00:00:00`);
  parsed.setMonth(parsed.getMonth() + monthOffset, 1);
  return parsed.toISOString().slice(0, 10);
}

function formatCalendarDay(dateString: string): string {
  const parsed = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function getCalendarDays(anchorDate: string): Array<{ iso: string; dayNumber: number; inMonth: boolean }> {
  const base = new Date(`${anchorDate}T00:00:00`);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      iso: date.toISOString().slice(0, 10),
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}

function statusClasses(status: CalendarStatus): string {
  switch (status) {
    case "open":
      return "border-yellow-300/50 bg-yellow-400/20 text-yellow-50";
    case "hold":
      return "border-zinc-300/40 bg-zinc-400/15 text-zinc-50";
    case "booked":
      return "border-green-300/50 bg-green-400/20 text-green-50";
    case "need":
      return "border-yellow-300/50 bg-yellow-400/20 text-yellow-50";
  }
}

function statusLabel(status: CalendarStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "hold":
      return "Hold";
    case "booked":
      return "Booked";
    case "need":
      return "Need";
  }
}

function statusMarker(status: CalendarStatus): string {
  switch (status) {
    case "open":
      return "O";
    case "hold":
      return "H";
    case "booked":
      return "B";
    case "need":
      return "N";
  }
}

function CalendarSketch({
  title,
  entries,
  accountType,
  userId,
  searchHref,
}: {
  title: string;
  entries: CalendarEntry[];
  accountType: "artist" | "club-booker";
  userId: string;
  searchHref: string;
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [, setCalendarVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(entries[0]?.date ?? "");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [detailsDate, setDetailsDate] = useState<string | null>(null);
  const [selectedArtistProfileUserId, setSelectedArtistProfileUserId] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const anchor = entries[0]?.date ?? "2026-04-01";
    return `${anchor.slice(0, 7)}-01`;
  });
  const persistedEntries =
    isClient && userId ? readStoredCalendarEntries(accountType, userId) : [];
  const mergedEntries = [
    ...entries.map((entry) => {
      const override = persistedEntries.find((item) => item.date === entry.date);
      if (!override) {
        return entry;
      }

      if (override.cleared) {
        return null;
      }

      return { ...entry, ...override };
    }),
    ...persistedEntries.filter(
      (entry) => !entry.cleared && !entries.some((baseEntry) => baseEntry.date === entry.date),
    ),
  ].filter((entry): entry is CalendarEntry => Boolean(entry));
  const activeDate = selectedDate || mergedEntries[0]?.date || "";
  const selectedEntry = mergedEntries.find((entry) => entry.date === activeDate) ?? null;
  const detailsEntry = detailsDate
    ? mergedEntries.find((entry) => entry.date === detailsDate) ?? null
    : null;
  const days = getCalendarDays(visibleMonth);
  const artistResults = useMemo(
    () => (accountType === "club-booker" ? getSearchResultsFromMock("club-booker") : []),
    [accountType],
  );

  function saveCalendarEntry(nextStatus: CalendarStatus, nextTitle: string, nextDetail: string) {
    if (!editingDate || !userId) {
      return;
    }

    const nextEntries = [
      ...persistedEntries.filter((entry) => entry.date !== editingDate),
      {
        date: editingDate,
        status: nextStatus,
        title: nextTitle,
        detail: nextDetail,
      },
    ];

    writeStoredCalendarEntries(accountType, userId, nextEntries);
    setCalendarVersion((value) => value + 1);
    setSelectedDate(editingDate);
    setEditingDate(null);
  }

  function clearCalendarEntry() {
    if (!editingDate || !userId) {
      return;
    }

    const nextEntries = [
      ...persistedEntries.filter((entry) => entry.date !== editingDate),
      {
        date: editingDate,
        cleared: true,
      },
    ];
    writeStoredCalendarEntries(accountType, userId, nextEntries);
    setCalendarVersion((value) => value + 1);
    setSelectedDate(editingDate);
    setEditingDate(null);
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wider text-white">{title}</h2>
          <p className="mt-2 text-zinc-300">Sketch: month view with clickable date states and a detail panel.</p>
          <Link className="btn-secondary mt-4 inline-flex" href={searchHref}>
            Search
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em]">
          {accountType === "artist" ? (
            <span className="rounded-full border border-yellow-300/50 bg-yellow-400/20 px-3 py-1 text-yellow-50">
              Open
            </span>
          ) : (
            <>
              <span className="rounded-full border border-zinc-300/40 bg-zinc-400/15 px-3 py-1 text-zinc-50">
                Hold
              </span>
              <span className="rounded-full border border-yellow-300/50 bg-yellow-400/20 px-3 py-1 text-yellow-50">
                Need
              </span>
            </>
          )}
          <span className="rounded-full border border-green-300/50 bg-green-400/20 px-3 py-1 text-green-50">
            Booked
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="btn-secondary px-3 py-2"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
            >
              Prev
            </button>
            <div className="text-center">
              <p className="font-display text-2xl tracking-wider text-white">
                {formatCalendarHeader(visibleMonth)}
              </p>
              <p className="text-sm text-zinc-400">Month view</p>
            </div>
            <button
              type="button"
              className="btn-secondary px-3 py-2"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs tracking-[0.12em] text-zinc-500 uppercase">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {days.map((day) => {
              const entry = mergedEntries.find((item) => item.date === day.iso);
              const isSelected = activeDate === day.iso;

              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.iso);
                    if (!entry) {
                      setEditingDate(day.iso);
                    }
                  }}
                  className={`min-h-20 rounded-xl border px-2 py-2 text-left transition-colors ${
                    entry
                      ? `${statusClasses(entry.status)} ${isSelected ? "ring-2 ring-white/60" : "hover:border-white/50"}`
                      : `border-white/10 bg-black/20 text-zinc-500 ${isSelected ? "ring-2 ring-white/40" : "hover:border-white/30 hover:bg-white/5"}`
                  }`}
                >
                  <div className="flex h-full flex-col items-start gap-2">
                    <span className={`text-sm font-semibold ${day.inMonth ? "text-current" : "text-zinc-600"}`}>
                      {day.dayNumber}
                    </span>
                    {entry ? (
                      <span className="text-lg font-bold leading-none uppercase tracking-[0.02em]">
                        {statusMarker(entry.status)}
                      </span>
                    ) : null}
                  </div>
                  {!entry ? (
                    <span className="mt-auto text-[10px] uppercase tracking-[0.12em] text-zinc-600">Set</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Selected Date</p>
          {selectedEntry ? (
            <>
              <h3 className="mt-2 font-display text-2xl tracking-wider text-white">
                {formatCalendarDay(selectedEntry.date)}
              </h3>
              <div className={`mt-4 rounded-xl border px-4 py-3 ${statusClasses(selectedEntry.status)}`}>
                <p className="text-xs tracking-[0.12em] uppercase">Status</p>
                <p className="mt-1 text-sm uppercase tracking-[0.12em]">{statusLabel(selectedEntry.status)}</p>
                <p className="mt-1 font-semibold">{selectedEntry.title}</p>
              </div>
              <p className="mt-4 text-zinc-200">{selectedEntry.detail}</p>
              {accountType === "club-booker" && (selectedEntry.lineup?.length || selectedEntry.slotsNeeded !== undefined) ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Lineup</p>
                  {selectedEntry.lineup && selectedEntry.lineup.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-zinc-100">
                      {selectedEntry.lineup.map((band) => (
                        <li key={band}>{band}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-zinc-300">No bands confirmed yet.</p>
                  )}
                  <p className="mt-3 text-sm text-zinc-300">
                    {selectedEntry.slotsNeeded === 0
                      ? "Bill is full."
                      : `${selectedEntry.slotsNeeded ?? 0} slot${selectedEntry.slotsNeeded === 1 ? "" : "s"} still open.`}
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                className="btn-secondary mt-5"
                onClick={() => setDetailsDate(selectedEntry.date)}
              >
                Details
              </button>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-display text-2xl tracking-wider text-white">
                {activeDate ? formatCalendarDay(activeDate) : "Pick a date"}
              </h3>
              <p className="mt-4 text-zinc-300">
                This date does not have a status yet. Click it in the calendar to set availability or booking state.
              </p>
            </>
          )}
        </div>
      </div>

      {editingDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Edit Date</p>
                <h3 className="mt-2 font-display text-3xl tracking-wider text-white">
                  {formatCalendarDay(editingDate)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDate(null)}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close date editor"
              >
                X
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-white">Set status for this date</p>
              {accountType === "artist" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-xl border border-yellow-300/50 bg-yellow-400/20 px-4 py-3 text-left text-yellow-50"
                    onClick={() =>
                      saveCalendarEntry("open", "Open", "Available for booking and actively looking for a show.")
                    }
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-green-300/50 bg-green-400/20 px-4 py-3 text-left text-green-50"
                    onClick={() =>
                      saveCalendarEntry("booked", "Booked", "Confirmed show or private event already scheduled.")
                    }
                  >
                    Booked
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    className="rounded-xl border border-yellow-300/50 bg-yellow-400/20 px-4 py-3 text-left text-yellow-50"
                    onClick={() =>
                      saveCalendarEntry("need", "Need artist", "Looking to fill this slot with a matching act.")
                    }
                  >
                    Need Artist
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-300/40 bg-zinc-400/15 px-4 py-3 text-left text-zinc-50"
                    onClick={() =>
                      saveCalendarEntry("hold", "Hold", "Soft hold while the lineup is being finalized.")
                    }
                  >
                    Hold
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-green-300/50 bg-green-400/20 px-4 py-3 text-left text-green-50"
                    onClick={() =>
                      saveCalendarEntry("booked", "Booked", "Date is committed and no longer needs talent.")
                    }
                  >
                    Booked
                  </button>
                </div>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="btn-secondary" onClick={clearCalendarEntry}>
                Clear Status
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Date Details</p>
                <h3 className="mt-2 font-display text-3xl tracking-wider text-white">
                  {formatCalendarDay(detailsEntry.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsDate(null)}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close show details"
              >
                X
              </button>
            </div>

            <div className={`mt-6 rounded-xl border px-4 py-3 ${statusClasses(detailsEntry.status)}`}>
              <p className="text-xs tracking-[0.12em] uppercase">Status</p>
              <p className="mt-1 text-sm uppercase tracking-[0.12em]">{statusLabel(detailsEntry.status)}</p>
              <p className="mt-1 font-semibold">
                {accountType === "club-booker" && detailsEntry.status === "booked" && detailsEntry.slotsNeeded === 0
                  ? "Bill is full."
                  : detailsEntry.title}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Details</p>
              <p className="mt-2 text-zinc-300">{detailsEntry.detail}</p>
            </div>

            {accountType === "club-booker" && (detailsEntry.lineup?.length || detailsEntry.slotsNeeded !== undefined) ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Lineup</p>
                  {detailsEntry.lineup && detailsEntry.lineup.length > 0 ? (
                    <ul className="mt-3 space-y-3">
                      {detailsEntry.lineup.map((band) => {
                        const artist = artistResults.find((entry) => entry.name === band);

                        return (
                          <li key={band} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">{band}</p>
                                <p className="mt-2 text-sm text-zinc-400">
                                  Contact: {artist?.email || "No contact listed"}
                                </p>
                                <p className="mt-1 text-sm text-zinc-400">Booking status: confirmed</p>
                              </div>
                              {artist ? (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => {
                                    setDetailsDate(null);
                                    setSelectedArtistProfileUserId(artist.userId);
                                  }}
                                >
                                  View Profile
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-zinc-300">No bands confirmed yet.</p>
                  )}
                  {detailsEntry.slotsNeeded !== 0 ? (
                    <p className="mt-4 text-sm text-zinc-300">
                      {detailsEntry.slotsNeeded ?? 0} slot{detailsEntry.slotsNeeded === 1 ? "" : "s"} still open.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : detailsEntry.venueInfo ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Venue</p>
                  <p className="mt-1 font-semibold text-white">{detailsEntry.venueInfo.name}</p>
                  <p className="mt-2 text-sm text-zinc-300">{detailsEntry.venueInfo.address}</p>
                  <p className="mt-2 text-sm text-zinc-300">{detailsEntry.venueInfo.phone}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Contact</p>
                  <p className="mt-1 font-semibold text-white">{detailsEntry.venueInfo.contactName}</p>
                  <p className="mt-2 text-sm text-zinc-300">{detailsEntry.venueInfo.contactEmail}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Schedule</p>
                  <p className="mt-1 text-sm text-zinc-200">Load-in: {detailsEntry.venueInfo.loadInTime}</p>
                  <p className="mt-1 text-sm text-zinc-200">Soundcheck: {detailsEntry.venueInfo.soundcheckTime}</p>
                  <p className="mt-1 text-sm text-zinc-200">Set time: {detailsEntry.venueInfo.setTime}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Special Instructions</p>
                  <p className="mt-1 text-sm text-zinc-200">{detailsEntry.venueInfo.specialInstructions}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                Additional event info is not available for this date yet.
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDetailsDate(null);
                  setEditingDate(detailsEntry.date);
                }}
              >
                Edit Status
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedArtistProfileUserId ? (
        <ArtistProfileModal
          artistUserId={selectedArtistProfileUserId}
          onClose={() => setSelectedArtistProfileUserId(null)}
        />
      ) : null}
    </section>
  );
}

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const [isProfileActionsOpen, setIsProfileActionsOpen] = useState(false);

  const profile = useMemo(() => {
    const raw = toRawSearchParams(new URLSearchParams(searchParams.toString()));
    const accountType = getAccountTypeFromSearchParams(raw);
    const fallback = getProfileFallbackFromMock(accountType);
    return parseProfileFromSearchParams(raw, fallback);
  }, [searchParams]);

  const editHref = `/dashboard/edit?${toSearchString(profile)}`;
  const searchHref = `/dashboard/search?${toSearchString(profile)}`;
  const profileQuery = toSearchString(profile);
  const dashboardReturnTo = `/dashboard?${profileQuery}`;
  const publicProfileHref = (() => {
    const params = new URLSearchParams();
    params.set("returnTo", dashboardReturnTo);

    if (profile.accountType === "club-booker" && profile.clubPicUrl) {
      params.set("clubPicUrl", profile.clubPicUrl);
    }

    const basePath =
      profile.accountType === "artist"
        ? `/dashboard/artist/${profile.userId}`
        : `/dashboard/club/${profile.userId}`;

    return `${basePath}?${params.toString()}`;
  })();
  const [, setBillingStatusRefreshKey] = useState(0);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const availabilityEntries = profile.accountType === "artist" ? artistAvailability : clubAvailability;
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

  if (profile.accountType === "club-booker" && !isClient) {
    return <main className="min-h-screen py-10" />;
  }

  const hasClubSubscription =
    profile.accountType !== "club-booker"
      ? true
      : (() => {
          try {
            const stored = window.localStorage.getItem(
              getClubBillingStorageKey(getClubBillingIdentifier(profile)),
            );

            if (!stored) {
              return false;
            }

            const parsed = JSON.parse(stored) as { active?: boolean };
            return parsed.active === true;
          } catch {
            return false;
          }
        })();

  if (profile.accountType === "club-booker" && !hasClubSubscription) {
    const billingHref = `/billing?${profileQuery}`;

    return (
      <main className="min-h-screen py-10">
        <div className="mx-auto grid w-full max-w-4xl gap-6">
          <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
            <p className="text-xs tracking-[0.2em] text-zinc-400 uppercase">Billing Required</p>
            <h1 className="mt-2 font-display text-4xl tracking-wider text-white md:text-5xl">
              Activate Your Club Subscription
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Clubs and bookers need an active subscription to unlock artist search, booking requests, and contact
              details. Artists remain free.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-primary" href={billingHref}>
                Go to Billing
              </Link>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setBillingStatusRefreshKey((value) => value + 1)}
              >
                Refresh Status
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

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
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsProfileActionsOpen(true)}
            >
              Profile
            </button>
          </div>

          {profile.accountType === "artist" ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Email</p>
                <p className="mt-1 font-semibold text-white">{profile.email}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Home City</p>
                <p className="mt-1 font-semibold text-white">{profile.artistHomeCity}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Artist Type</p>
                <p className="mt-1 font-semibold text-white">{artistTypeLabel(profile.artistType)}</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Email</p>
                <p className="mt-1 font-semibold text-white">{profile.email}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Location</p>
                <p className="mt-1 font-semibold text-white">{profile.location}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-400 uppercase">Venue Capacity</p>
                <p className="mt-1 font-semibold text-white">{profile.venueCapacity}</p>
              </div>
            </div>
          )}
        </section>

        {isProfileActionsOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-zinc-950 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Profile Actions</p>
                  <h2 className="mt-2 font-display text-4xl tracking-wider text-white">
                    {profile.accountType === "artist" ? profile.bandName : profile.venueName}
                  </h2>
                  <p className="mt-1 text-zinc-300">
                    {profile.accountType === "artist" ? profile.artistHomeCity : profile.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileActionsOpen(false)}
                  className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close profile actions"
                >
                  X
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <Link className="btn-secondary justify-center" href={editHref}>
                  Edit Profile
                </Link>
                <Link className="btn-secondary justify-center" href={publicProfileHref}>
                  View Public Profile
                </Link>
                {profile.accountType === "club-booker" ? (
                  <Link className="btn-secondary justify-center" href={`/billing?${profileQuery}`}>
                    Billing
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <CalendarSketch
          title={
            profile.accountType === "artist"
              ? `${profile.bandName} Booking Calendar`
              : `${profile.venueName} Booking Calendar`
          }
          entries={availabilityEntries}
          accountType={profile.accountType}
          userId={profile.userId}
          searchHref={searchHref}
        />

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
