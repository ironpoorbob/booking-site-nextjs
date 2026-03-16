import Link from "next/link";
import { withBasePath } from "@/lib/base-path";

export default function SignupPage() {
  return (
    <main className="noise-bg min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/20 bg-black/70 p-8 shadow-2xl md:p-10">
        <h1 className="font-display text-5xl tracking-wider text-white md:text-6xl">Create Account</h1>
        <p className="mt-3 text-zinc-300">Join as an artist or a club/booker.</p>

        <form className="mt-8 space-y-5" action={withBasePath("/dashboard")} method="get">
          <fieldset>
            <legend className="mb-2 text-sm tracking-[0.12em] text-zinc-200 uppercase">I am a...</legend>
            <div className="role-group">
              <label className="role-option">
                <input type="radio" name="accountType" value="artist" defaultChecked />
                Artist
              </label>
              <label className="role-option">
                <input type="radio" name="accountType" value="club-booker" />
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

          <button className="btn-primary w-full justify-center mt-5" type="submit">
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
