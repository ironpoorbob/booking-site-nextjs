"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

export default function SignupPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = searchParams.get("accountType") === "club-booker" ? "club-booker" : "artist";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    formData.forEach((value, key) => {
      if (typeof value === "string") {
        params.append(key, value);
      }
    });

    const destination =
      accountType === "club-booker" ? `/billing?${params.toString()}` : `/dashboard?${params.toString()}`;

    router.push(destination);
  }

  return (
    <main className="noise-bg min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/20 bg-black/70 p-8 shadow-2xl md:p-10">
        <h1 className="font-display text-5xl tracking-wider text-white md:text-6xl">Create Account</h1>
        <p className="mt-3 text-zinc-300">Join as an artist or a club/booker.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <fieldset>
            <legend className="mb-2 text-sm tracking-[0.12em] text-zinc-200 uppercase">I am a...</legend>
            <div className="role-group">
              <label className="role-option">
                <input type="radio" name="accountType" value="artist" defaultChecked={accountType === "artist"} />
                Artist
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="accountType"
                  value="club-booker"
                  defaultChecked={accountType === "club-booker"}
                />
                Club / Booker
              </label>
            </div>
          </fieldset>

          <label className="form-group">
            <span>Username</span>
            <input className="form-input" name="username" type="text" />
          </label>

          <label className="form-group">
            <span>Password</span>
            <input className="form-input" name="password" type="password" />
          </label>

          <label className="form-group">
            <span>Email</span>
            <input className="form-input" name="email" type="email" />
          </label>

          <label className="form-group">
            <span>Real Name</span>
            <input className="form-input" name="realName" type="text" />
          </label>
          <button className="btn-primary mt-5 w-full justify-center" type="submit">
            Create Account
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-300">
          Already have an account?{" "}
          <Link className="text-red-300 hover:text-red-200" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
