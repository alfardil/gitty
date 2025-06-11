"use client";

import React from "react";
import { Card } from "@/components/ui/neo/card";
import MainCard from "../../components/MainCard";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-primary">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-2 sm:px-0">
        <div className="relative w-full max-w-xl mb-8">
          <Card className="bg-white rounded-xl shadow-lg p-8 border-4 border-black">
            <MainCard />
          </Card>
        </div>
      </div>
    </div>
  );
}
