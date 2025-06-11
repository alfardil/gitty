"use client";

import Link from "next/link";
import Image from "next/image";
import { GitHubLoginButton } from "@/components/LoginButton";
import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/neo/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/neo/dropdown-menu";

export default function Header() {
  const isMobile = useIsMobile();

  return (
    <header className="w-full h-20 flex items-center justify-between px-4 fixed top-0 left-0 z-30">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="mr-2 p-4 rounded focus:outline-none cursor-pointer bg-blue-300 hover:bg-blue-400 transition-colors"
              aria-label="Open menu"
              variant="noShadow"
            >
              <Menu size={24} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            sideOffset={8}
            align="start"
            className="bg-blue-300"
          >
            <DropdownMenuLabel>Services</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="w-full cursor-pointer"
                tabIndex={-1}
              >
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/diagram"
                className="w-full cursor-pointer"
                tabIndex={-1}
              >
                Diagram
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/chat"
                className="w-full cursor-pointer"
                tabIndex={-1}
              >
                Chat
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!isMobile && (
          <Link href="/" className="flex items-center gap-2">
            <Image src="/favicon.svg" alt="Logo" width={40} height={40} />
            <span className="font-bold text-xl">Gitty</span>
          </Link>
        )}
      </div>
      <div className="flex items-center">
        <GitHubLoginButton />
      </div>
    </header>
  );
}
