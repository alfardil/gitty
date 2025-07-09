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
    <AceNavbar>
      <NavBody className="bg-black relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold md:text-2xl text-white">
            DevBoard
          </span>
        </div>
        <NavItems items={navItems} className="ml-8" onItemClick={onItemClick} />
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

      <MobileNavWrapper>
        <div className="lg:hidden relative z-10">
          <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 rounded-full mx-4 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">DevBoard</span>
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

            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-zinc-800 rounded-lg shadow-lg">
                <div className="flex flex-col p-2">
                  {navItems.map((item, idx) => (
                    <a
                      key={`mobile-link-${idx}`}
                      href={item.link}
                      onClick={(e) => {
                        onItemClick(e, item);
                        setIsMobileMenuOpen(false);
                      }}
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
  );
}
