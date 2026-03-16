import Link from "next/link";
import { withBasePath } from "@/lib/base-path";

export default function LoginPage() {
  return (
    <main className="noise-bg min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/20 bg-black/70 p-8 shadow-2xl md:p-10">
        <h1 className="font-display text-5xl tracking-wider text-white md:text-6xl">Log In</h1>
        <p className="mt-3 text-zinc-300">Welcome back. Let&apos;s get your next show booked.</p>

        <form className="mt-8 space-y-5" action={withBasePath("/dashboard")} method="get">
          <label className="form-group">
            <span>Username</span>
            <input className="form-input" name="username" type="text" />
          </label>

          <label className="form-group">
            <span>Password</span>
            <input className="form-input" name="password" type="password" />
          </label>

          <button className="btn-primary w-full justify-center mt-5" type="submit">
            Log In
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-300">
          New here?{" "}
          <Link className="text-red-300 hover:text-red-200" href="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
