"use client";

import { FlipWords } from "@/components/ui/ace/flip-words";

export function Hero() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 text-center z-10 min-h-screen">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
        Effortless
        <span className="inline-block mx-2 align-middle">
          <FlipWords
            words={[
              "Onboarding",
              "Codebase Insights",
              "AI-Powered Search",
              "System Visualization",
            ]}
            className="text-[#18CCFC]"
          />
        </span>
        <br />
        for Modern Teams
      </h1>
      <p className="text-lg md:text-2xl text-white/70 max-w-2xl mx-auto mb-8">
        Accelerate your team&apos;s productivity with instant codebase context,
        smart search, and AI-powered onboarding.
      </p>
    </main>
  );
}
