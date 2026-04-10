import Link from "next/link";
import { Suspense } from "react";
import { getArtistByUserIdFromMock, getArtistUserIdsFromMock } from "../../mock-data";
import ArtistProfilePanel from "../../ArtistProfilePanel";
import ProfileReturnLink from "../../ProfileReturnLink";

type ArtistProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const userIds = getArtistUserIdsFromMock();
  return userIds.map((userId) => ({ userId }));
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { userId } = await params;
  const artist = getArtistByUserIdFromMock(userId);

  if (!artist) {
    return (
      <main className="min-h-screen py-10">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <h1 className="font-display text-4xl tracking-wider text-white">Artist Not Found</h1>
          <p className="mt-3 text-zinc-300">No artist profile matches this ID.</p>
          <div className="mt-5">
            <Suspense
              fallback={
                <Link className="btn-secondary" href="/dashboard/search?accountType=club-booker">
                  Back to Search
                </Link>
              }
            >
              <ProfileReturnLink fallbackHref="/dashboard/search?accountType=club-booker" />
            </Suspense>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <ArtistProfilePanel
          artist={artist}
          headerAction={
            <Suspense
              fallback={
                <Link className="btn-secondary" href="/dashboard/search?accountType=club-booker">
                  Back to Search
                </Link>
              }
            >
              <ProfileReturnLink fallbackHref="/dashboard/search?accountType=club-booker" />
            </Suspense>
          }
        />
      </div>
    </main>
  );
}
