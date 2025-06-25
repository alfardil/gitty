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
import { Card, CardContent } from "@/components/ui/neo/card";
import { Code, Search, Users } from "lucide-react";
import { Button as MovingBorderButton } from "@/components/ui/ace/moving-border";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MobileNavWrapper = ({
  visible,
  children,
}: {
  visible?: boolean;
  children: React.ReactNode;
}) => {
  return children;
};

export default function LandingPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col">
      <BackgroundBeams className="fixed inset-0 z-0 pointer-events-none" />
      <AceNavbar>
        {/* Desktop Navbar */}
        <NavBody className="bg-black relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold md:text-2xl text-white">
              DevBoard
            </span>
          </div>
          <NavItems
            items={navItems}
            className="ml-8"
            onItemClick={handleItemClick}
          />
          <MovingBorderButton
            borderRadius="1.75rem"
            className="bg-black text-white border-white cursor-pointer"
            onClick={() => {
              router.push("/dashboard");
            }}
          >
            Get Started
          </MovingBorderButton>
        </NavBody>

        {/* Mobile Navbar */}
        <MobileNavWrapper>
          <div className="lg:hidden relative z-10">
            <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 rounded-full mx-4 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">
                    DevBoard
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white p-2"
                >
                  {isMobileMenuOpen ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Mobile Menu Dropdown */}
              {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-zinc-800 rounded-lg shadow-lg">
                  <div className="flex flex-col p-2">
                    {navItems.map((item, idx) => (
                      <a
                        key={`mobile-link-${idx}`}
                        href={item.link}
                        onClick={(e) => handleItemClick(e, item)}
                        className="px-4 py-3 text-white hover:bg-zinc-800 rounded-lg transition-colors text-left flex items-center justify-between"
                      >
                        {item.name}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </a>
                    ))}
                    <button
                      onClick={() => {
                        router.push("/dashboard");
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-3 cursor-pointer text-white hover:bg-zinc-800 rounded-lg transition-colors text-left flex items-center justify-between w-full"
                    >
                      Get Started
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </MobileNavWrapper>
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
          Accelerate your team&apos;s productivity with instant codebase
          context, smart search, and AI-powered onboarding.
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

      <section
        id="features"
        className="relative w-full bg-black z-10 px-4 py-40 min-h-[100vh]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Why Choose DevBoard?
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
              Transform how your development team understands, navigates, and
              contributes to your codebase
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[#18CCFC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Code className="w-8 h-8 text-[#18CCFC]" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  Instant Codebase Understanding
                </h3>
                <p className="text-white/70 leading-relaxed">
                  Get new developers up to speed in minutes, not weeks. Our AI
                  analyzes your entire codebase to provide instant context and
                  architectural insights.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[#18CCFC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-[#18CCFC]" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  Smart Code Search
                </h3>
                <p className="text-white/70 leading-relaxed">
                  Find exactly what you&apos;re looking for with natural
                  language queries. Search by functionality, not just keywords,
                  and discover related code patterns instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[#18CCFC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-[#18CCFC]" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  Team Collaboration Hub
                </h3>
                <p className="text-white/70 leading-relaxed">
                  Bridge the knowledge gap between senior and junior developers.
                  Share insights, document decisions, and maintain institutional
                  knowledge effortlessly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center bg-black z-10 px-4 py-20 border-t border-t-zinc-900">
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
