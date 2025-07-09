"use client";

import { BackgroundBeams } from "@/components/ui/ace/background-beams";
import { MacbookScroll } from "@/components/ui/ace/macbook-scroll";
import { Navbar } from "./_components/Navbar";
import { Hero } from "./_components/Hero";
import { StatsSection } from "./_components/StatsSection";
import { DemoVideo } from "./_components/DemoVideo";
import { FeaturesSection } from "./_components/FeaturesSection";
import { WaitlistSection } from "./_components/waitlist/WaitlistSection";

export default function LandingPage() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    const navbar = document.querySelector('[class*="sticky"]');

    if (featuresSection) {
      const navbarHeight = navbar
        ? navbar.getBoundingClientRect().height + 20
        : 100;
      const elementPosition = featuresSection.offsetTop - navbarHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Talk to Sales", link: "#" },
    { name: "Pricing", link: "#" },
  ];

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: { name: string; link: string }
  ) => {
    if (item.name === "Features") {
      e.preventDefault();
      scrollToFeatures();
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col">
      <BackgroundBeams className="fixed inset-0 z-0 pointer-events-none" />
      <Navbar navItems={navItems} onItemClick={handleItemClick} />
      <Hero />
      <section className="relative w-full min-h-[200vh] flex items-center justify-center bg-black z-10">
        <MacbookScroll
          src="/analysis.png"
          showGradient={true}
          title=" "
          badge="DevBoard"
        />
      </section>
      <StatsSection />
      <DemoVideo />
      <FeaturesSection />
      <WaitlistSection />
    </div>
  );
}
