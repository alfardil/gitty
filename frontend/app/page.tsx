"use client";

import { BackgroundBeams } from "@/components/ui/ace/background-beams";
import { FlipWords } from "@/components/ui/ace/flip-words";
import {
  Navbar as AceNavbar,
  NavBody,
  NavItems,
} from "@/components/ui/ace/resizable-navbar";
import { MacbookScroll } from "@/components/ui/ace/macbook-scroll";
import { PlaceholdersAndVanishInput } from "@/components/ui/ace/placeholders-and-vanish-input";
import React from "react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col">
      <BackgroundBeams className="fixed inset-0 z-0 pointer-events-none" />
      <AceNavbar>
        <NavBody className="bg-black relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold md:text-2xl text-blue-100">
              DevBoard
            </span>
          </div>
          <NavItems
            items={[
              { name: "Features", link: "#" },
              { name: "Talk to Sales", link: "#" },
              { name: "Pricing", link: "#" },
            ]}
            className="ml-8"
          />
        </NavBody>
      </AceNavbar>
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
          Accelerate your team's productivity with instant codebase context,
          smart search, and AI-powered onboarding.
        </p>
      </main>
      <section className="relative w-full min-h-[200vh] flex items-center justify-center bg-black z-10">
        <MacbookScroll
          src="https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d"
          showGradient={false}
          title=" "
          badge="Gitty"
        />
      </section>

      <section className="relative w-full min-h-[60vh] flex flex-col items-center justify-center bg-black z-10 px-4 py-20 border-t border-t-zinc-900">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          Join the Waitlist
        </h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto text-center">
          Be the first to get access when we launch. Enter your email below:
        </p>
        <div className="w-full max-w-xl mx-auto">
          <PlaceholdersAndVanishInput
            placeholders={[
              "Enter your work email",
              "you@company.com",
              "Get notified on launch",
            ]}
            onChange={() => {}}
            onSubmit={() => {}}
          />
        </div>
      </section>
    </div>
  );
}
