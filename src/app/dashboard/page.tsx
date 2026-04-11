"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { getClubBillingIdentifier, getClubBillingStorageKey } from "../billing";
import ArtistProfileModal from "./ArtistProfileModal";
import { artistTypeLabel, artistTypeOptions, genreOptions } from "./options";
import ArtistInquiryList from "./ArtistInquiryList";
import BookingInquiryList from "./BookingInquiryList";
import { getCoordinatesForLocation, getProfileFallbackFromMock, getSearchResultsFromMock } from "./mock-data";
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
  lineup?: string[];
  slotsNeeded?: number;
  cleared?: boolean;
};

type InquiryStatus = "sent" | "interested" | "accepted" | "declined";

type ClubDateInquiry = {
  date: string;
  artistUserId: string;
  note: string;
  status: InquiryStatus;
  contactLog?: string[];
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

const clubDateInquiryDefaults: ClubDateInquiry[] = [
  {
    date: "2026-04-03",
    artistUserId: "artist_006",
    note: "Carlos followed up about headlining the full April 3 bill.",
    status: "interested",
  },
  {
    date: "2026-04-03",
    artistUserId: "artist_011",
    note: "The Not Yetis confirmed they can support and are ready to be locked in.",
    status: "accepted",
  },
  {
    date: "2026-04-11",
    artistUserId: "artist_001",
    note: "Decal sent availability and asked for set times and payout details.",
    status: "sent",
  },
  {
    date: "2026-04-11",
    artistUserId: "artist_005",
    note: "Clark Nova is interested if the touring package fits their routing.",
    status: "interested",
  },
  {
    date: "2026-04-25",
    artistUserId: "artist_003",
    note: "Midnight Static accepted the hold and is ready for confirmation.",
    status: "accepted",
  },
  {
    date: "2026-04-25",
    artistUserId: "artist_012",
    note: "Kingdom First asked if there is room for a heavier late set.",
    status: "sent",
  },
];

function getCalendarStorageKey(accountType: "artist" | "club-booker", userId: string): string {
  return `bookemdanno.calendar.${accountType}.${userId}`;
}

function getClubDateInquiryStorageKey(userId: string): string {
  return `bookemdanno.club-date-inquiries.${userId}`;
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

function readStoredClubDateInquiries(userId: string): ClubDateInquiry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(getClubDateInquiryStorageKey(userId));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ClubDateInquiry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredClubDateInquiries(userId: string, entries: ClubDateInquiry[]): void {
  window.localStorage.setItem(getClubDateInquiryStorageKey(userId), JSON.stringify(entries));
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

function getDistanceMiles(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const earthRadiusMiles = 3958.8;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLatRadians = (from.lat * Math.PI) / 180;
  const toLatRadians = (to.lat * Math.PI) / 180;

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLatRadians) *
      Math.cos(toLatRadians) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMiles * arc;
}

function matchesSelectedGenres(genres: string[] | undefined, selectedGenres: string[]): boolean {
  if (selectedGenres.length === 0) {
    return true;
  }

  return selectedGenres.some((genre) => (genres ?? []).includes(genre));
}

function formatContactLogTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function inquiryStatusClasses(status: InquiryStatus): string {
  switch (status) {
    case "sent":
      return "border-sky-300/40 bg-sky-400/15 text-sky-50";
    case "interested":
      return "border-yellow-300/50 bg-yellow-400/20 text-yellow-50";
    case "accepted":
      return "border-green-300/50 bg-green-400/20 text-green-50";
    case "declined":
      return "border-zinc-300/40 bg-zinc-400/15 text-zinc-50";
  }
}

function inquiryStatusLabel(status: InquiryStatus): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "interested":
      return "Interested";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
  }
}

function getClubTargetBandCount(entry: CalendarEntry | null): number {
  const lineupCount = entry?.lineup?.length ?? 0;
  const slotCount = entry?.slotsNeeded ?? 0;
  const derivedCount = lineupCount + slotCount;

  if (derivedCount >= 1) {
    return derivedCount;
  }

  return 3;
}

function buildClubDateStatusCopy(
  status: CalendarStatus,
  targetBandCount: number,
  lineup: string[] = [],
): { title: string; detail: string; slotsNeeded: number } {
  const confirmedCount = lineup.length;
  const slotsNeeded = Math.max(0, targetBandCount - confirmedCount);

  switch (status) {
    case "need":
      return {
        title: `${confirmedCount} of ${targetBandCount} bands booked`,
        detail:
          slotsNeeded > 0
            ? `Looking to fill ${slotsNeeded} more slot${slotsNeeded === 1 ? "" : "s"} for this bill.`
            : "Lineup is full and ready to confirm.",
        slotsNeeded,
      };
    case "hold":
      return {
        title: `${confirmedCount} of ${targetBandCount} bands booked`,
        detail:
          confirmedCount > 0
            ? `Lineup is on hold while confirmations are being finalized. ${slotsNeeded} slot${slotsNeeded === 1 ? "" : "s"} still open.`
            : "Date is on hold while the lineup is being finalized.",
        slotsNeeded,
      };
    case "booked":
      return {
        title: confirmedCount >= targetBandCount ? "Full bill booked" : `${confirmedCount} of ${targetBandCount} bands booked`,
        detail:
          confirmedCount >= targetBandCount
            ? "Lineup locked in and ready to promote."
            : `Date is committed. ${slotsNeeded} slot${slotsNeeded === 1 ? "" : "s"} still need confirmation.`,
        slotsNeeded,
      };
    case "open":
      return {
        title: "Open",
        detail: "Available for booking and actively looking for a show.",
        slotsNeeded,
      };
  }
}

function CalendarSketch({
  title,
  entries,
  accountType,
  userId,
}: {
  title: string;
  entries: CalendarEntry[];
  accountType: "artist" | "club-booker";
  userId: string;
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [, setCalendarVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [detailsDate, setDetailsDate] = useState<string | null>(null);
  const [editingClubEventDate, setEditingClubEventDate] = useState<string | null>(null);
  const [selectedArtistProfileUserId, setSelectedArtistProfileUserId] = useState<string | null>(null);
  const [draftEntriesByDate, setDraftEntriesByDate] = useState<Record<string, CalendarEntry | null>>({});
  const [draftInquiriesByKey, setDraftInquiriesByKey] = useState<Record<string, ClubDateInquiry>>({});
  const [workflowSearchInput, setWorkflowSearchInput] = useState("");
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const anchor = entries[0]?.date ?? "2026-04-01";
    return `${anchor.slice(0, 7)}-01`;
  });
  const persistedEntries =
    isClient && userId ? readStoredCalendarEntries(accountType, userId) : [];
  const persistedClubDateInquiries =
    isClient && accountType === "club-booker" && userId ? readStoredClubDateInquiries(userId) : [];
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
  function getEntryForDate(date: string): CalendarEntry | null {
    if (!date) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(draftEntriesByDate, date)) {
      return draftEntriesByDate[date];
    }

    return mergedEntries.find((entry) => entry.date === date) ?? null;
  }
  const activeDate = selectedDate;
  const selectedEntry = getEntryForDate(activeDate);
  const detailsEntry = detailsDate ? getEntryForDate(detailsDate) : null;
  const days = getCalendarDays(visibleMonth);
  const artistResults = useMemo(
    () => (accountType === "club-booker" ? getSearchResultsFromMock("club-booker") : []),
    [accountType],
  );
  const workflowArtists = useMemo(() => {
    if (accountType !== "club-booker") {
      return [];
    }

    const query = workflowSearchQuery.trim().toLowerCase();

    return artistResults.filter((artist) => {
      if (!query) {
        return true;
      }

      return (
        artist.name.toLowerCase().includes(query) ||
        artist.city.toLowerCase().includes(query) ||
        artist.summary.toLowerCase().includes(query) ||
        (artist.artistDescription ?? "").toLowerCase().includes(query)
      );
    });
  }, [accountType, artistResults, workflowSearchQuery]);
  function runWorkflowSearch() {
    setWorkflowSearchQuery(workflowSearchInput.trim());
  }

  function getDateInquiries(date: string): ClubDateInquiry[] {
    const baseEntries =
      accountType === "club-booker" ? clubDateInquiryDefaults.filter((entry) => entry.date === date) : [];
    const overrideEntries = persistedClubDateInquiries.filter((entry) => entry.date === date);
    const merged = [...baseEntries];

    overrideEntries.forEach((entry) => {
      const existingIndex = merged.findIndex((item) => item.artistUserId === entry.artistUserId);

      if (existingIndex >= 0) {
        merged[existingIndex] = entry;
      } else {
        merged.push(entry);
      }
    });

    Object.values(draftInquiriesByKey)
      .filter((entry) => entry.date === date)
      .forEach((entry) => {
        const existingIndex = merged.findIndex((item) => item.artistUserId === entry.artistUserId);

        if (existingIndex >= 0) {
          merged[existingIndex] = entry;
        } else {
          merged.push(entry);
        }
      });

    return merged;
  }

  function saveDateInquiry(date: string, nextInquiry: ClubDateInquiry) {
    if (!userId || accountType !== "club-booker") {
      return;
    }

    const nextEntries = [
      ...persistedClubDateInquiries.filter(
        (entry) => !(entry.date === date && entry.artistUserId === nextInquiry.artistUserId),
      ),
      nextInquiry,
    ];

    writeStoredClubDateInquiries(userId, nextEntries);
    setDraftInquiriesByKey((current) => ({
      ...current,
      [`${date}:${nextInquiry.artistUserId}`]: nextInquiry,
    }));
    setCalendarVersion((value) => value + 1);
  }

  function sendInquiryToArtist(date: string, artistUserId: string) {
    if (accountType !== "club-booker") {
      return;
    }

    const artist = artistResults.find((entry) => entry.userId === artistUserId);

    if (!artist) {
      return;
    }

    const timestamp = new Date().toISOString();
    const existingInquiry = getDateInquiries(date).find((entry) => entry.artistUserId === artistUserId);
    const nextLogEntry = `Email sent to ${artist.name} contact email`;

    saveDateInquiry(date, {
      date,
      artistUserId,
      note: existingInquiry?.note ?? `Sent booking inquiry for ${formatCalendarDay(date)}.`,
      status: existingInquiry?.status === "accepted" ? "accepted" : "sent",
      contactLog: [...(existingInquiry?.contactLog ?? []), `${timestamp}|${nextLogEntry}`],
    });
  }

  function saveCalendarEntry(
    date: string,
    nextStatus: CalendarStatus,
    nextTitle: string,
    nextDetail: string,
    extra?: Pick<CalendarOverride, "lineup" | "slotsNeeded">,
  ) {
    if (!userId) {
      return;
    }

    const nextEntries = [
      ...persistedEntries.filter((entry) => entry.date !== date),
      {
        date,
        status: nextStatus,
        title: nextTitle,
        detail: nextDetail,
        lineup: extra?.lineup,
        slotsNeeded: extra?.slotsNeeded,
      },
    ];

    writeStoredCalendarEntries(accountType, userId, nextEntries);
    setDraftEntriesByDate((current) => ({
      ...current,
      [date]: {
        date,
        status: nextStatus,
        title: nextTitle,
        detail: nextDetail,
        lineup: extra?.lineup,
        slotsNeeded: extra?.slotsNeeded,
      },
    }));
    setCalendarVersion((value) => value + 1);
    setSelectedDate(date);
  }

  function clearCalendarEntry(date: string) {
    if (!userId) {
      return;
    }

    const nextEntries = [
      ...persistedEntries.filter((entry) => entry.date !== date),
      {
        date,
        cleared: true,
      },
    ];
    writeStoredCalendarEntries(accountType, userId, nextEntries);
    setDraftEntriesByDate((current) => ({
      ...current,
      [date]: null,
    }));
    setCalendarVersion((value) => value + 1);
    setSelectedDate(date);
    setEditingDate(null);
  }

  function confirmArtistForDate(date: string, artistUserId: string) {
    if (accountType !== "club-booker") {
      return;
    }

    const artist = artistResults.find((entry) => entry.userId === artistUserId);

    if (!artist) {
      return;
    }

    const existingEntry = getEntryForDate(date);
    const nextLineup = [...new Set([...(existingEntry?.lineup ?? []), artist.name])];
    const totalSlots = getClubTargetBandCount(existingEntry);
    const slotsNeeded = Math.max(0, totalSlots - nextLineup.length);
    const nextStatus = slotsNeeded === 0 ? "booked" : "need";
    const nextCopy = buildClubDateStatusCopy(nextStatus, totalSlots, nextLineup);

    saveCalendarEntry(date, nextStatus, nextCopy.title, nextCopy.detail, {
      lineup: nextLineup,
      slotsNeeded: nextCopy.slotsNeeded,
    });

    const existingInquiry = getDateInquiries(date).find((entry) => entry.artistUserId === artistUserId);
    saveDateInquiry(date, {
      date,
      artistUserId,
      note: existingInquiry?.note ?? `${artist.name} was confirmed to this date.`,
      status: "accepted",
    });
    setDetailsDate(date);
    setEditingDate(null);
  }

  function removeArtistFromDate(date: string, artistName: string) {
    if (accountType !== "club-booker") {
      return;
    }

    const existingEntry = getEntryForDate(date);

    if (!existingEntry) {
      return;
    }

    const nextLineup = (existingEntry.lineup ?? []).filter((name) => name !== artistName);
    const targetBandCount = getClubTargetBandCount(existingEntry);
    const nextStatus = nextLineup.length >= targetBandCount ? "booked" : "need";
    const nextCopy = buildClubDateStatusCopy(nextStatus, targetBandCount, nextLineup);

    saveCalendarEntry(date, nextStatus, nextCopy.title, nextCopy.detail, {
      lineup: nextLineup,
      slotsNeeded: nextCopy.slotsNeeded,
    });
  }

  function renderClubDateWorkflow(date: string, mode: "create" | "details") {
    const dateInquiries = getDateInquiries(date);
    const existingEntry = getEntryForDate(date);
    const currentStatus = existingEntry?.status ?? null;
    const visibleArtists = workflowSearchQuery ? workflowArtists.slice(0, 5) : [];
    const targetBandCount = getClubTargetBandCount(existingEntry);
    const visibleDateInquiries = dateInquiries.filter((inquiry) => {
      const artist = artistResults.find((entry) => entry.userId === inquiry.artistUserId);
      return !(artist && existingEntry?.lineup?.includes(artist.name));
    });

    function statusButtonClasses(status: CalendarStatus): string {
      const isActive = currentStatus === status;
      return `${statusClasses(status)} rounded-xl border px-4 py-3 text-left ${isActive ? "ring-2 ring-white/70" : ""}`;
    }

    return (
      <>
        <div className="mt-6 space-y-3">
          <div className={`rounded-xl border px-4 py-3 ${statusClasses(currentStatus ?? "need")}`}>
            <p className="text-xs tracking-[0.12em] uppercase">Status</p>
            {existingEntry ? (
              <>
                <p className="mt-1 text-sm uppercase tracking-[0.12em]">{statusLabel(existingEntry.status)}</p>
                <p className="mt-1 font-semibold">{existingEntry.title}</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm uppercase tracking-[0.12em]">Need Bands</p>
                <p className="mt-1 font-semibold">0 of {targetBandCount} bands booked</p>
              </>
            )}
          </div>
          <p className="text-sm font-semibold text-white">Date status</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              className={statusButtonClasses("need")}
              onClick={() =>
                saveCalendarEntry(
                  date,
                  "need",
                  buildClubDateStatusCopy("need", targetBandCount, existingEntry?.lineup).title,
                  buildClubDateStatusCopy("need", targetBandCount, existingEntry?.lineup).detail,
                  {
                    lineup: existingEntry?.lineup,
                    slotsNeeded: buildClubDateStatusCopy("need", targetBandCount, existingEntry?.lineup).slotsNeeded,
                  },
                )
              }
            >
              Need Artist
            </button>
            <button
              type="button"
              className={statusButtonClasses("hold")}
              onClick={() =>
                saveCalendarEntry(
                  date,
                  "hold",
                  buildClubDateStatusCopy("hold", targetBandCount, existingEntry?.lineup).title,
                  buildClubDateStatusCopy("hold", targetBandCount, existingEntry?.lineup).detail,
                  {
                    lineup: existingEntry?.lineup,
                    slotsNeeded: buildClubDateStatusCopy("hold", targetBandCount, existingEntry?.lineup).slotsNeeded,
                  },
                )
              }
            >
              Hold
            </button>
            <button
              type="button"
              className={statusButtonClasses("booked")}
              onClick={() =>
                saveCalendarEntry(
                  date,
                  "booked",
                  buildClubDateStatusCopy("booked", targetBandCount, existingEntry?.lineup).title,
                  buildClubDateStatusCopy("booked", targetBandCount, existingEntry?.lineup).detail,
                  {
                    lineup: existingEntry?.lineup,
                    slotsNeeded: buildClubDateStatusCopy("booked", targetBandCount, existingEntry?.lineup).slotsNeeded,
                  },
                )
              }
            >
              Booked
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
          <label className="form-group">
            <span>How Many Bands Are You Booking?</span>
            <input
              className="form-input mt-2"
              type="number"
              min="1"
              value={targetBandCount}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const nextTarget = Math.max(1, Number.isFinite(parsed) ? parsed : 3);
                const nextStatus = existingEntry?.status ?? "need";
                const nextCopy = buildClubDateStatusCopy(nextStatus, nextTarget, existingEntry?.lineup);

                saveCalendarEntry(date, nextStatus, nextCopy.title, nextCopy.detail, {
                  lineup: existingEntry?.lineup,
                  slotsNeeded: nextCopy.slotsNeeded,
                });
              }}
            />
          </label>
        </div>

        {existingEntry ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Details</p>
            <p className="mt-2 text-zinc-300">{existingEntry.detail}</p>
          </div>
        ) : null}

        <div
          className={`mt-6 rounded-xl p-4 ${
            (existingEntry?.lineup?.length ?? 0) > 0
              ? "border border-green-300/40 bg-green-400/10"
              : "border border-yellow-300/40 bg-yellow-400/10"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Confirmed Lineup</p>
              <p className="mt-2 text-sm text-zinc-300">
                Edit the current bill by removing bands or adding more through inquiries and search.
              </p>
            </div>
            <p className="text-sm text-zinc-400">
              {(existingEntry?.lineup?.length ?? 0)} of {targetBandCount} bands confirmed
            </p>
          </div>

          {existingEntry?.lineup && existingEntry.lineup.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {existingEntry.lineup.map((band) => {
                const artist = artistResults.find((entry) => entry.name === band);

                return (
                  <li key={`${date}-${band}`} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{band}</p>
                        <p className="mt-2 text-sm text-zinc-400">Contact: {artist?.email || "No contact listed"}</p>
                        <p className="mt-1 text-sm text-zinc-400">Booking status: confirmed</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {artist ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setSelectedArtistProfileUserId(artist.userId)}
                          >
                            View Profile
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => removeArtistFromDate(date, band)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-zinc-300">No bands are confirmed for this event yet.</p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Inquiry Status</p>
              <p className="mt-2 text-sm text-zinc-300">
                Track outreach for this date and confirm bands as they accept.
              </p>
            </div>
            {existingEntry?.lineup?.length ? (
              <p className="text-sm text-zinc-400">{existingEntry.lineup.length} band{existingEntry.lineup.length === 1 ? "" : "s"} confirmed</p>
            ) : null}
          </div>

          {visibleDateInquiries.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {visibleDateInquiries.map((inquiry) => {
                const artist = artistResults.find((entry) => entry.userId === inquiry.artistUserId);
                const isConfirmed = Boolean(artist && existingEntry?.lineup?.includes(artist.name));

                return (
                  <li key={`${inquiry.date}-${inquiry.artistUserId}`} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{artist?.name || inquiry.artistUserId}</p>
                        <p className="mt-1 text-sm text-zinc-400">{artist?.city || "Location coming soon"}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${inquiryStatusClasses(inquiry.status)}`}>
                        {isConfirmed ? "Confirmed" : inquiryStatusLabel(inquiry.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{inquiry.note}</p>
                    {inquiry.contactLog && inquiry.contactLog.length > 0 ? (
                      <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Outreach</p>
                        <ul className="mt-2 space-y-2">
                          {inquiry.contactLog.slice().reverse().map((entry) => {
                            const [timestamp, message] = entry.split("|");

                            return (
                              <li key={entry}>
                                <p>{message || entry}</p>
                                <p className="mt-1 text-xs text-zinc-500">{formatContactLogTimestamp(timestamp)}</p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {artist ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedArtistProfileUserId(artist.userId)}
                        >
                          View Profile
                        </button>
                      ) : null}
                      {inquiry.status !== "interested" && !isConfirmed ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => saveDateInquiry(date, { ...inquiry, status: "interested" })}
                        >
                          Mark Interested
                        </button>
                      ) : null}
                      {inquiry.status !== "accepted" && !isConfirmed ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => saveDateInquiry(date, { ...inquiry, status: "accepted" })}
                        >
                          Mark Accepted
                        </button>
                      ) : null}
                      {inquiry.status === "accepted" && artist && !isConfirmed ? (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => confirmArtistForDate(date, artist.userId)}
                        >
                          Confirm to Date
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-zinc-300">No inquiries are attached to this date yet.</p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Search Bands for This Date</p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              runWorkflowSearch();
            }}
          >
            <input
              className="form-input"
              type="text"
              value={workflowSearchInput}
              onChange={(event) => setWorkflowSearchInput(event.target.value)}
              placeholder="Search artists by name, city, or style"
            />
            <button
              type="submit"
              className="btn-secondary sm:self-start"
            >
              Search
            </button>
          </form>
          {workflowSearchQuery ? (
            <div className="mt-4 grid gap-3">
            {visibleArtists.length > 0 ? visibleArtists.map((artist) => {
              const inquiry = dateInquiries.find((entry) => entry.artistUserId === artist.userId);
              const isConfirmed = Boolean(existingEntry?.lineup?.includes(artist.name));

              return (
                <div key={`${date}-${artist.userId}`} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{artist.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">{artist.city}</p>
                      <p className="mt-2 text-sm text-zinc-300">{artist.summary}</p>
                    </div>
                    {isConfirmed ? (
                      <span className="rounded-full border border-green-300/50 bg-green-400/20 px-3 py-1 text-xs uppercase tracking-[0.12em] text-green-50">
                        Booked
                      </span>
                    ) : inquiry ? (
                      <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${inquiryStatusClasses(inquiry.status)}`}>
                        {inquiryStatusLabel(inquiry.status)}
                      </span>
                    ) : null}
                  </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSelectedArtistProfileUserId(artist.userId)}
                    >
                      View Profile
                    </button>
                    {!isConfirmed ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => sendInquiryToArtist(date, artist.userId)}
                      >
                        {inquiry ? "Send Follow-Up" : "Send Inquiry"}
                      </button>
                    ) : null}
                    {inquiry?.status === "accepted" && !isConfirmed ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => confirmArtistForDate(date, artist.userId)}
                      >
                        Confirm to Date
                      </button>
                    ) : null}
                  </div>
                  {inquiry?.contactLog && inquiry.contactLog.length > 0 ? (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">
                      <p>{inquiry.contactLog[inquiry.contactLog.length - 1]?.split("|")[1] ?? "Outreach sent"}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatContactLogTimestamp(inquiry.contactLog[inquiry.contactLog.length - 1]?.split("|")[0] ?? "")}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">Check your email for response.</p>
                    </div>
                  ) : null}
                </div>
              );
            }) : (
                <p className="text-zinc-300">No artists matched that search.</p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-zinc-300">Run a search to view matching artists for this date.</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={() => clearCalendarEntry(date)}>
            Clear Status
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (mode === "create") {
                setEditingDate(null);
              } else {
                setDetailsDate(null);
              }
            }}
          >
            Done
          </button>
        </div>
      </>
    );
  }

  function renderBookedClubEventView(date: string) {
    const entry = getEntryForDate(date);

    if (!entry) {
      return null;
    }

    return (
      <>
        <div className={`mt-6 rounded-xl border px-4 py-3 ${statusClasses(entry.status)}`}>
          <p className="text-xs tracking-[0.12em] uppercase">Status</p>
          <p className="mt-1 text-sm uppercase tracking-[0.12em]">{statusLabel(entry.status)}</p>
          <p className="mt-1 font-semibold">
            {entry.slotsNeeded === 0 ? "Bill is full." : entry.title}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Details</p>
          <p className="mt-2 text-zinc-300">{entry.detail}</p>
        </div>

        <div
          className={`mt-6 rounded-xl p-4 ${
            (entry.lineup?.length ?? 0) > 0
              ? "border border-green-300/40 bg-green-400/10"
              : "border border-yellow-300/40 bg-yellow-400/10"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Confirmed Lineup</p>
              <p className="mt-2 text-sm text-zinc-300">
                {entry.lineup?.length ?? 0} of {getClubTargetBandCount(entry)} bands confirmed
              </p>
            </div>
          </div>

          {entry.lineup && entry.lineup.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {entry.lineup.map((band) => {
                const artist = artistResults.find((item) => item.name === band);

                return (
                  <li key={band} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{band}</p>
                        <p className="mt-2 text-sm text-zinc-400">Contact: {artist?.email || "No contact listed"}</p>
                        <p className="mt-1 text-sm text-zinc-400">Booking status: confirmed</p>
                      </div>
                      {artist ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedArtistProfileUserId(artist.userId)}
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
            <p className="mt-4 text-zinc-300">No bands have been listed for this event yet.</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setEditingClubEventDate(date)}
          >
            Edit Event
          </button>
        </div>
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wider text-white">{title}</h2>
          <p className="mt-2 text-zinc-300">Sketch: month view with clickable date states and a detail panel.</p>
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
                      if (accountType === "club-booker") {
                        setWorkflowSearchQuery("");
                        setWorkflowSearchInput("");
                      }
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
                onClick={() => {
                  setEditingClubEventDate(null);
                  setDetailsDate(selectedEntry.date);
                }}
              >
                Details
              </button>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-display text-2xl tracking-wider text-white">
                Pick a date
              </h3>
              <p className="mt-4 text-zinc-300">
                Click a date to add or update booking details.
              </p>
            </>
          )}
        </div>
      </div>

      {editingDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/20 bg-zinc-950 p-6">
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
                      saveCalendarEntry(
                        editingDate,
                        "open",
                        "Open",
                        "Available for booking and actively looking for a show.",
                      )
                    }
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-green-300/50 bg-green-400/20 px-4 py-3 text-left text-green-50"
                    onClick={() =>
                      saveCalendarEntry(
                        editingDate,
                        "booked",
                        "Booked",
                        "Confirmed show or private event already scheduled.",
                      )
                    }
                  >
                    Booked
                  </button>
                </div>
              ) : (
                renderClubDateWorkflow(editingDate, "create")
              )}
            </div>
            {accountType === "artist" ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="btn-secondary" onClick={() => clearCalendarEntry(editingDate)}>
                  Clear Status
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {detailsEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/20 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Date Details</p>
                <h3 className="mt-2 font-display text-3xl tracking-wider text-white">
                  {formatCalendarDay(detailsEntry.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingClubEventDate(null);
                  setDetailsDate(null);
                }}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close show details"
              >
                X
              </button>
            </div>

            {accountType === "club-booker" ? (
              detailsEntry.status === "booked" && editingClubEventDate !== detailsEntry.date
                ? renderBookedClubEventView(detailsEntry.date)
                : renderClubDateWorkflow(detailsEntry.date, "details")
            ) : (
              <>
                <div className={`mt-6 rounded-xl border px-4 py-3 ${statusClasses(detailsEntry.status)}`}>
                  <p className="text-xs tracking-[0.12em] uppercase">Status</p>
                  <p className="mt-1 text-sm uppercase tracking-[0.12em]">{statusLabel(detailsEntry.status)}</p>
                  <p className="mt-1 font-semibold">{detailsEntry.title}</p>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Details</p>
                  <p className="mt-2 text-zinc-300">{detailsEntry.detail}</p>
                </div>
              </>
            )}

            {accountType !== "club-booker" && detailsEntry.venueInfo ? (
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
            ) : accountType !== "club-booker" ? (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                Additional event info is not available for this date yet.
              </div>
            ) : null}

            {accountType === "artist" ? (
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
            ) : null}
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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalInput, setSearchModalInput] = useState("");
  const [searchModalMusicTypeInput, setSearchModalMusicTypeInput] = useState<string[]>([]);
  const [searchModalDistanceInput, setSearchModalDistanceInput] = useState("25");
  const [searchModalArtistTypeInput, setSearchModalArtistTypeInput] = useState("musician-band");
  const [searchModalQuery, setSearchModalQuery] = useState("");
  const [searchModalMusicType, setSearchModalMusicType] = useState<string[]>([]);
  const [searchModalDistance, setSearchModalDistance] = useState("25");
  const [searchModalArtistType, setSearchModalArtistType] = useState("musician-band");
  const [selectedSearchArtistUserId, setSelectedSearchArtistUserId] = useState<string | null>(null);

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
  const genericSearchResults = useMemo(() => {
    if (profile.accountType !== "club-booker") {
      return [];
    }

    const query = searchModalQuery.trim().toLowerCase();
    const distanceLimitMiles = searchModalDistance === "any" ? null : Number(searchModalDistance);
    const searchOrigin =
      getCoordinatesForLocation(searchModalQuery) ||
      getCoordinatesForLocation(profile.location);
    const shouldUseQueryAsDistanceOrigin = Boolean(query) && Boolean(searchOrigin) && distanceLimitMiles !== null;

    if (
      !query &&
      searchModalMusicType.length === 0 &&
      searchModalArtistType === "musician-band" &&
      searchModalDistance === "25"
    ) {
      return [];
    }

    return allArtistResults.filter((artist) => {
      const matchesQuery =
        !query ||
        shouldUseQueryAsDistanceOrigin ||
        artist.name.toLowerCase().includes(query) ||
        artist.city.toLowerCase().includes(query) ||
        artist.summary.toLowerCase().includes(query) ||
        (artist.artistDescription ?? "").toLowerCase().includes(query);

      if (!matchesQuery) {
        return false;
      }

      if (
        searchModalArtistType !== "musician-band" &&
        (artist.artistType ?? "musician-band") !== searchModalArtistType
      ) {
        return false;
      }

      if (!matchesSelectedGenres(artist.genres, searchModalMusicType)) {
        return false;
      }

      if (
        distanceLimitMiles !== null &&
        searchOrigin &&
        typeof artist.lat === "number" &&
        typeof artist.lng === "number"
      ) {
        const distance = getDistanceMiles(searchOrigin, { lat: artist.lat, lng: artist.lng });

        if (distance > distanceLimitMiles) {
          return false;
        }
      }

      return true;
    }).sort((left, right) => {
      if (
        distanceLimitMiles === null ||
        !searchOrigin ||
        typeof left.lat !== "number" ||
        typeof left.lng !== "number" ||
        typeof right.lat !== "number" ||
        typeof right.lng !== "number"
      ) {
        return 0;
      }

      const leftDistance = getDistanceMiles(searchOrigin, { lat: left.lat, lng: left.lng });
      const rightDistance = getDistanceMiles(searchOrigin, { lat: right.lat, lng: right.lng });

      return leftDistance - rightDistance;
    });
  }, [
    allArtistResults,
    profile.accountType,
    profile.location,
    searchModalDistance,
    searchModalArtistType,
    searchModalMusicType,
    searchModalQuery,
  ]);
  const hasSubmittedGenericSearch =
    Boolean(searchModalQuery) ||
    searchModalMusicType.length > 0 ||
    searchModalArtistType !== "musician-band" ||
    searchModalDistance !== "25";
  function runGenericSearch() {
    setSearchModalQuery(searchModalInput.trim());
    setSearchModalMusicType(searchModalMusicTypeInput);
    setSearchModalDistance(searchModalDistanceInput);
    setSearchModalArtistType(searchModalArtistTypeInput);
  }

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
            <div className="flex flex-wrap gap-2">
              {profile.accountType === "club-booker" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearchModalInput("");
                    setSearchModalMusicTypeInput([]);
                    setSearchModalDistanceInput("25");
                    setSearchModalArtistTypeInput("musician-band");
                    setSearchModalQuery("");
                    setSearchModalMusicType([]);
                    setSearchModalDistance("25");
                    setSearchModalArtistType("musician-band");
                    setIsSearchModalOpen(true);
                  }}
                >
                  Search
                </button>
              ) : (
                <Link className="btn-secondary" href={searchHref}>
                  Search
                </Link>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsProfileActionsOpen(true)}
              >
                Profile
              </button>
            </div>
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

        {isSearchModalOpen && profile.accountType === "club-booker" ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/20 bg-zinc-950 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Talent Search</p>
                  <h2 className="mt-2 font-display text-4xl tracking-wider text-white">Browse Artists</h2>
                  <p className="mt-1 text-zinc-300">Use this for generic artist search outside a specific date.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(false)}
                  className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close talent search"
                >
                  X
                </button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  runGenericSearch();
                }}
              >
                <input
                  className="form-input mt-6"
                  type="text"
                  value={searchModalInput}
                  onChange={(event) => setSearchModalInput(event.target.value)}
                  placeholder="Search artists by name or city"
                />

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="form-group">
                      <span>Artist Type</span>
                      <select
                        className="form-input"
                        value={searchModalArtistTypeInput}
                        onChange={(event) => setSearchModalArtistTypeInput(event.target.value)}
                      >
                        {artistTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-group">
                      <span>Distance</span>
                      <select
                        className="form-input"
                        value={searchModalDistanceInput}
                        onChange={(event) => setSearchModalDistanceInput(event.target.value)}
                      >
                        <option value="10">Within 10 miles</option>
                        <option value="25">Within 25 miles</option>
                        <option value="50">Within 50 miles</option>
                        <option value="any">Anywhere</option>
                      </select>
                    </label>
                  </div>
                  <label className="form-group">
                    <span>Music Type</span>
                    <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {genreOptions.map((option) => (
                        <label key={option.value} className="inline-flex items-center gap-2 text-sm text-zinc-100">
                          <input
                            type="checkbox"
                            checked={searchModalMusicTypeInput.includes(option.value)}
                            onChange={(event) =>
                              setSearchModalMusicTypeInput((current) =>
                                event.target.checked
                                  ? [...current, option.value]
                                  : current.filter((value) => value !== option.value),
                              )
                            }
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="btn-secondary"
                  >
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-6 grid gap-3">
                {hasSubmittedGenericSearch ? (
                  genericSearchResults.length > 0 ? (
                    genericSearchResults.slice(0, 8).map((artist) => (
                      <div key={artist.userId} className="rounded-xl border border-white/10 bg-black/40 p-4">
                        <p className="font-semibold text-white">{artist.name}</p>
                        <p className="mt-1 text-zinc-300">{artist.city}</p>
                        <p className="mt-2 text-zinc-200">{artist.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setSelectedSearchArtistUserId(artist.userId)}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-300">No artists matched that search.</p>
                  )
                ) : (
                  <p className="text-zinc-300">Set your filters and click `Search` to browse artists.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {selectedSearchArtistUserId ? (
          <ArtistProfileModal
            artistUserId={selectedSearchArtistUserId}
            onClose={() => setSelectedSearchArtistUserId(null)}
          />
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
