"use client";

import { WaitlistInput } from "@/app/_components/waitlist/WaitlistInput";
import { useState, useEffect } from "react";

export function WaitlistSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("waitlist-section");
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="waitlist-section"
      className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] z-10 px-4"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Section indicator */}
        <div className="flex items-center justify-center mb-16 opacity-60">
          <div className="w-16 h-px bg-white/30"></div>
          <span className="mx-4 text-white/60 text-sm tracking-widest">
            [0.3]
          </span>
          <div className="w-16 h-px bg-white/30"></div>
        </div>

        {/* Main content */}
        <div
          className={`space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Join the
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              Intelligence Network
            </span>
          </h2>

          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Be the first to access Thestral&apos;s AI-powered startup
            intelligence platform. Join founders who are already transforming
            their decision-making.
          </p>

          {/* Waitlist input */}
          <div className="pt-8">
            <WaitlistInput />
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-center mt-16 opacity-60">
          <div className="w-16 h-px bg-white/30"></div>
          <span className="mx-4 text-white/60 text-sm tracking-widest">
            [0.4]
          </span>
          <div className="w-16 h-px bg-white/30"></div>
        </div>
      </div>

      {/* Visual design elements */}
      <div
        className={`absolute top-1/4 left-1/6 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-full transition-all duration-1000 delay-300 pointer-events-none ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
      ></div>
      <div
        className={`absolute bottom-1/4 right-1/6 w-48 h-48 bg-gradient-to-bl from-white/5 to-transparent border border-white/10 rounded-full transition-all duration-1000 delay-500 pointer-events-none ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
      ></div>

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
          backgroundSize: "80px 80px",
        }}
      />
    </section>
  );
}
