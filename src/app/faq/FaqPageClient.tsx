"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const sections = [
  {
    title: "Before The Show",
    items: [
      "Confirm load-in, soundcheck, and set times with every band on the bill.",
      "Make sure each band knows who the point of contact is on show day.",
      "Verify backline, drum breakables, amps, and any shared gear expectations.",
      "Ask about guest list needs, merch setup, and parking instructions.",
    ],
  },
  {
    title: "Questions To Ask The Band",
    items: [
      "How long is your set and do you need any schedule flexibility?",
      "Are you bringing your own gear or sharing backline with the bill?",
      "Do you have any stage plot, input list, or monitor needs?",
      "Who should we contact day-of if anything changes?",
    ],
  },
  {
    title: "Promo And Logistics",
    items: [
      "Ask bands for updated artwork, links, and the best social handles to tag.",
      "Confirm ticketing, payout, and settlement expectations before show day.",
      "Share venue rules around curfews, door times, and merch percentages if applicable.",
      "Remind bands about check-in time, parking limits, and any age restrictions for the room.",
    ],
  },
];

function withQuery(path: string, queryString: string): string {
  return queryString ? `${path}?${queryString}` : path;
}

export default function FaqPageClient() {
  const searchParams = useSearchParams();
  const profileQuery = searchParams.toString();
  const dashboardHref = withQuery("/dashboard", profileQuery);
  const searchHref = withQuery("/dashboard/search", profileQuery);
  const profileHref = withQuery("/dashboard/edit", profileQuery);

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6 px-6">
        <section className="rounded-2xl border border-white/15 bg-black/70 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-2xl tracking-wider text-white">Book&apos;EmDanno</p>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-secondary" href={dashboardHref}>
                Dashboard
              </Link>
              <Link className="btn-secondary" href={searchHref}>
                Search
              </Link>
              <Link className="btn-secondary" href={profileHref}>
                Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">FAQ</p>
          <h1 className="mt-2 font-display text-4xl tracking-wider text-white md:text-5xl">
            Event To-Dos
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            A simple checklist for things to confirm with bands before a show is fully locked in.
          </p>
          <div className="mt-5">
            <Link className="btn-secondary" href={dashboardHref}>
              Back To Dashboard
            </Link>
          </div>
        </section>

        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-white/10 bg-black/40 p-6"
          >
            <h2 className="font-display text-2xl tracking-wider text-white">{section.title}</h2>
            <ul className="mt-4 space-y-3 text-zinc-300">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
