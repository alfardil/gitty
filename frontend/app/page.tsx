"use client";

import { useState, useEffect } from "react";
import { Navbar } from "./_components/Navbar";
import { Hero } from "./_components/Hero";
import { VideoSection } from "./_components/VideoSection";
import { MissionsSection } from "./_components/MissionsSection";
import { WaitlistSection } from "./_components/waitlist/WaitlistSection";


export default function LandingPage() {

  const scrollToMission = () => {
    const missionSection = document.getElementById("missions-section");
    const navbar = document.querySelector('[class*="sticky"]');

    if (missionSection) {
      const navbarHeight = navbar
        ? navbar.getBoundingClientRect().height + 20
        : 100;
      const elementPosition = missionSection.offsetTop - navbarHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  const navItems = [
    { name: "Mission", link: "#missions" },
    // { name: "Talk to Sales", link: "#" },
    // { name: "Pricing", link: "#" },
  ];

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: { name: string; link: string }
  ) => {
    if (item.name === "Mission") {
      e.preventDefault();
      scrollToMission();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden scroll-smooth">
      {/* Animated background grid */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <Navbar navItems={navItems} onItemClick={handleItemClick} />
      
      

      <div className="pt-32">
        <Hero />
        <VideoSection />
        <MissionsSection />
        <WaitlistSection />
      </div>
    </div>
  );
}
