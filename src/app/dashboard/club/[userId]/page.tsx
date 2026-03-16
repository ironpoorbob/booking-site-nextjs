import Link from "next/link";
import { getClubByUserIdFromMock, getClubUserIdsFromMock } from "../../mock-data";

type ClubProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export const dynamicParams = false;

function formatNeedDate(dateString: string): string {
  const parsed = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export async function generateStaticParams() {
  const userIds = getClubUserIdsFromMock();
  return userIds.map((userId) => ({ userId }));
}

export default async function ClubProfilePage({ params }: ClubProfilePageProps) {
  const { userId } = await params;
  const club = getClubByUserIdFromMock(userId);

  if (!club) {
    return (
      <main className="min-h-screen py-10">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <h1 className="font-display text-4xl tracking-wider text-white">Club Not Found</h1>
          <p className="mt-3 text-zinc-300">No club profile matches this ID.</p>
          <Link className="btn-secondary mt-5" href="/dashboard/search?accountType=artist">
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Club / Booker Profile</p>
              <h1 className="mt-1 font-display text-5xl tracking-wider text-white">{club.name}</h1>
              <p className="mt-2 text-zinc-300">{club.city}</p>
            </div>
            <Link className="btn-secondary" href="/dashboard/search?accountType=artist">
              Back to Search
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">Summary</p>
              <p className="mt-1 text-zinc-200">{club.summary}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">Capacity</p>
              <p className="mt-1 text-zinc-200">{club.capacity}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
              <p className="text-xs text-zinc-400 uppercase">Upcoming Booking Needs</p>
              {club.availableDates.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {club.availableDates.map((need) => (
                    <li
                      key={`${need.date}-${need.lookingFor}`}
                      className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-zinc-200"
                    >
                      <span className="font-semibold text-zinc-100">{formatNeedDate(need.date)}</span>
                      <span className="text-zinc-300">{" - "}</span>
                      <span>{need.lookingFor}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-zinc-200">No booking needs listed.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
