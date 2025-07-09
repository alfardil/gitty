"use client";

import { WaitlistInput } from "@/app/_components/waitlist/WaitlistInput";

export function WaitlistSection() {
  return (
    <section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center bg-black z-10 px-4 py-20 border-t border-t-zinc-900">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
        Join the Waitlist
      </h2>
      <p className="text-white/70 mb-8 max-w-xl mx-auto text-center">
        Be the first to get access when we launch. Enter your email below:
      </p>
      <WaitlistInput />
    </section>
  );
}
