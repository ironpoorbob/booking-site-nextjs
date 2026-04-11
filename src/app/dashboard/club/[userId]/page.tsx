import Link from "next/link";
import { Suspense } from "react";
import ClubProfilePageClient from "../ClubProfilePageClient";
import { getClubByUserIdFromMock, getClubUserIdsFromMock } from "../../mock-data";
import ProfileReturnLink from "../../ProfileReturnLink";

type ClubProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export const dynamicParams = false;

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
          <div className="mt-5">
            <Suspense
              fallback={
                <Link className="btn-secondary" href="/dashboard/search?accountType=artist">
                  Back to Search
                </Link>
              }
            >
              <ProfileReturnLink fallbackHref="/dashboard/search?accountType=artist" />
            </Suspense>
          </div>
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
            <Suspense
              fallback={
                <Link className="btn-secondary" href="/dashboard/search?accountType=artist">
                  Back to Search
                </Link>
              }
            >
              <ProfileReturnLink fallbackHref="/dashboard/search?accountType=artist" />
            </Suspense>
          </div>
          <Suspense fallback={<div className="mt-5 min-h-[260px]" />}>
            <ClubProfilePageClient club={club} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
