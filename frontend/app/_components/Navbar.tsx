"use client";

import {
  Navbar as AceNavbar,
  NavBody,
  NavItems,
} from "@/components/ui/ace/resizable-navbar";
import { Button as MovingBorderButton } from "@/components/ui/ace/moving-border";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MobileNavWrapper = ({ children }: { children: React.ReactNode }) => {
  return children;
};

interface NavbarProps {
  navItems: Array<{ name: string; link: string }>;
  onItemClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: { name: string; link: string }
  ) => void;
}

export function Navbar({ navItems, onItemClick }: NavbarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-4">
      <AceNavbar>
        <NavBody className="bg-[#0a0a0a]/95 backdrop-blur-md border border-white/10 relative z-10">
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm tracking-widest">
              SOFTWARE
            </span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border border-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-white font-semibold text-lg">Thestral</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NavItems
              items={navItems}
              className="ml-8"
              onItemClick={onItemClick}
            />
            <button
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300 text-sm"
              onClick={() => {
                const waitlistSection =
                  document.getElementById("waitlist-section");
                if (waitlistSection) {
                  waitlistSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Waitlist
            </button>
            <button
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-300 text-sm"
              onClick={() => router.push("/login")}
            >
              Get Started
            </button>
          </div>
        </NavBody>

        <MobileNavWrapper>
          <div className="lg:hidden relative z-10">
            <div className="bg-[#0a0a0a]/95 backdrop-blur-md border border-white/20 rounded-none mx-4 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border border-white rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                  <span className="text-white font-semibold">Thestral</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white p-2 hover:bg-white/10 transition-colors"
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

              {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 border border-white/20 rounded-none shadow-lg">
                  <div className="flex flex-col p-2">
                    {navItems.map((item, idx) => (
                      <a
                        key={`mobile-link-${idx}`}
                        href={item.link}
                        onClick={(e) => {
                          onItemClick(e, item);
                          setIsMobileMenuOpen(false);
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 rounded-none transition-colors text-left flex items-center justify-between"
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
                        const waitlistSection =
                          document.getElementById("waitlist-section");
                        if (waitlistSection) {
                          waitlistSection.scrollIntoView({
                            behavior: "smooth",
                          });
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-3 cursor-pointer text-white hover:bg-white/10 rounded-none transition-colors text-left flex items-center justify-between w-full"
                    >
                      Waitlist
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
                    <button
                      onClick={() => {
                        router.push("/login");
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-3 cursor-pointer text-white hover:bg-white/10 rounded-none transition-colors text-left flex items-center justify-between w-full"
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
    </div>
  );
}
