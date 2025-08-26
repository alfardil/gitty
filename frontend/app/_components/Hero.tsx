"use client";

import { useState, useEffect } from "react";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      id="hero"
      className="flex-1 flex flex-col items-center justify-center px-4 text-center z-10 min-h-screen relative"
    >
      {/* Main hero content */}
      <div
        className={`max-w-6xl mx-auto space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.2] tracking-tight pb-6">
          <span className="block">Your startup is</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            the intelligence system
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed font-light">
          Operating System for Startup Decision-Making
        </p>

        {/* Call to action */}
        <div className="pt-8">
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-12 py-4 bg-white text-black font-bold text-lg rounded-lg hover:bg-white/90 transition-all duration-300 border border-white transform hover:scale-105 shadow-lg cursor-pointer relative z-20"
          >
            GET STARTED
          </button>
          <p className="text-white/50 text-sm mt-2">*Beta v1</p>
        </div>
      </div>

      {/* Visual design elements */}
      <div
        className={`absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-full transition-all duration-1000 delay-300 pointer-events-none ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
      ></div>
      <div
        className={`absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-bl from-white/5 to-transparent border border-white/10 rounded-full transition-all duration-1000 delay-500 pointer-events-none ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
      ></div>
      <div
        className={`absolute bottom-1/4 left-1/3 w-32 h-32 bg-gradient-to-tr from-white/5 to-transparent border border-white/10 rounded-full transition-all duration-1000 delay-700 pointer-events-none ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
      ></div>

      {/* Bottom right visual element */}
      <div
        className={`absolute bottom-8 right-8 transition-all duration-1000 delay-500 pointer-events-none ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="w-32 h-32 bg-gradient-to-tr from-white/5 to-transparent border border-white/10 transform rotate-12" />
      </div>

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Floating particles */}
      <div
        className={`absolute top-1/2 left-1/6 w-2 h-2 bg-white/40 rounded-full transition-all duration-2000 delay-1000 pointer-events-none ${isVisible ? "opacity-100" : "opacity-0"}`}
      ></div>
      <div
        className={`absolute top-1/3 right-1/6 w-1 h-1 bg-white/30 rounded-full transition-all duration-2000 delay-1200 pointer-events-none ${isVisible ? "opacity-100" : "opacity-0"}`}
      ></div>
      <div
        className={`absolute bottom-1/3 left-1/6 w-1.5 h-1.5 bg-white/50 rounded-full transition-all duration-2000 delay-1400 pointer-events-none ${isVisible ? "opacity-100" : "opacity-0"}`}
      ></div>
    </main>
  );
}
