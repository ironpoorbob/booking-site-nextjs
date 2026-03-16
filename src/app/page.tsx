import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

export default function Home() {
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
