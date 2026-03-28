"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { withBasePath } from "@/lib/base-path";
import { getClubBillingIdentifier, getClubBillingStorageKey } from "../billing";
import { getProfileFallbackFromMock } from "../dashboard/mock-data";
import {
  getAccountTypeFromSearchParams,
  parseProfileFromSearchParams,
  toRawSearchParams,
  toSearchString,
} from "../dashboard/profile";

const MONTHLY_PRICE = "$10/month";

export default function BillingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const profile = useMemo(() => {
    const raw = toRawSearchParams(new URLSearchParams(searchParams.toString()));
    const accountType = getAccountTypeFromSearchParams(raw);
    const fallback = getProfileFallbackFromMock(accountType);
    return parseProfileFromSearchParams(raw, fallback);
  }, [searchParams]);

  const dashboardHref = `/dashboard?${toSearchString(profile)}`;
  const billingIdentifier = getClubBillingIdentifier(profile);
  const billingStatus = (() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(getClubBillingStorageKey(billingIdentifier));
      return stored ? (JSON.parse(stored) as { active?: boolean; provider?: string; plan?: string }) : null;
    } catch {
      return null;
    }
  })();
  const hasActiveSubscription = billingStatus?.active === true;

  function activateSubscription(provider: "stripe" | "paypal") {
    window.localStorage.setItem(
      getClubBillingStorageKey(billingIdentifier),
      JSON.stringify({
        active: true,
        provider,
        activatedAt: new Date().toISOString(),
        plan: MONTHLY_PRICE,
      }),
    );

    router.push(dashboardHref);
  }

  return (
    <>
      <header className="site-nav-wrap">
        <nav className="site-nav w-full">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between py-2">
            <Link className="site-brand" href="/">
              <Image
                src={withBasePath("/book-em-danno-logo.png")}
                alt="Book 'em, Danno! logo"
                width={260}
                height={173}
                className="h-auto w-40"
                priority
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link className="site-nav-link" href="/signup">
                Sign Up
              </Link>
              <Link className="site-nav-link" href="/login">
                Log In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="min-h-screen py-10">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
            <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Club Billing</p>
            <h1 className="mt-2 font-display text-4xl tracking-wider text-white md:text-5xl">
              {hasActiveSubscription ? "Manage Your Club Subscription" : "Activate Your Club Subscription"}
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Clubs and bookers need an active subscription to unlock artist details, outreach, and unlimited search.
              Artists remain free.
            </p>
            {hasActiveSubscription ? (
              <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-xs tracking-[0.12em] text-emerald-300 uppercase">Subscription Active</p>
                <p className="mt-2 text-zinc-200">
                  Your MVP club subscription is active via {billingStatus?.provider ?? "a provider"} on{" "}
                  {billingStatus?.plan ?? MONTHLY_PRICE}.
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Plan</p>
                <h2 className="mt-2 font-display text-3xl tracking-wider text-white">{MONTHLY_PRICE}</h2>
                <p className="mt-3 text-zinc-300">
                  Unlimited artist search, booking requests, and contact unlocking for your venue team.
                </p>
                <ul className="mt-5 space-y-3 text-zinc-200">
                  <li>Unlimited artist discovery</li>
                  <li>Send booking requests</li>
                  <li>Unlock artist contact details</li>
                  <li>Manage venue profile and booking needs</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Checkout</p>
                <p className="mt-3 text-zinc-300">
                  MVP billing gate. No payment data is stored in this prototype. Choose a hosted-provider direction to
                  {hasActiveSubscription ? " update your current subscription state." : " simulate activation."}
                </p>
                <div className="mt-6 grid gap-3">
                  <button type="button" className="btn-primary justify-center" onClick={() => activateSubscription("stripe")}>
                    {hasActiveSubscription ? "Switch to Stripe" : "Pay with Stripe"}
                  </button>
                  <button type="button" className="btn-secondary justify-center" onClick={() => activateSubscription("paypal")}>
                    {hasActiveSubscription ? "Switch to PayPal" : "Pay with PayPal"}
                  </button>
                </div>
                <p className="mt-4 text-sm text-zinc-400">
                  In production, these buttons should redirect to hosted subscription checkout.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-secondary" href={dashboardHref}>
                Back to Dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
