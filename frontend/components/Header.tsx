"use client";

import Link from "next/link";
import Image from "next/image";
import { GitHubLoginButton } from "@/components/LoginButton";
import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <header className="w-full h-20 flex items-center justify-between px-4 fixed top-0 left-0 z-30 bg-primary/80">
      <div className="flex items-center gap-2">
        <Button
          className="mr-2 p-4 rounded hover:bg-gray-200 focus:outline-none cursor-pointer"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
        >
          <Menu size={32} />
        </Button>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.svg" alt="Logo" width={40} height={40} />
          <span className="font-bold text-xl hidden sm:inline">Gitty</span>
        </Link>
        {open && (
          <div
            ref={menuRef}
            className="absolute top-16 left-4 bg-white border border-black rounded shadow-lg flex flex-col min-w-[200px] p-2 z-50"
          >
            <Link
              href="/dashboard"
              className="px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/diagram"
              className="px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Diagram
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Chat
            </Link>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <GitHubLoginButton />
      </div>
    </header>
  );
}
