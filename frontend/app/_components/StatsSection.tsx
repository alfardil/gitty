"use client";

import { useStats } from "@/lib/hooks/useStats";
import { BarChart3, Users, Database } from "lucide-react";

export function StatsSection() {
  const stats = useStats();

  if (!stats) return null;

  return (
    <section className="relative w-full bg-black z-10 px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Trusted by Developers Worldwide
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            See how DevBoard is transforming codebase understanding across teams
          </p>
        </div>

        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <div className="bg-[#23272f] rounded-2xl shadow-md p-6 flex flex-col gap-2 border-l-4 border-blue-400/60 relative hover:shadow-lg transition group w-56 min-w-[12rem] max-w-[15rem]">
            <div className="absolute top-4 right-4">
              <BarChart3 className="w-7 h-7 text-blue-400" />
            </div>
            <div className="text-4xl font-extrabold text-white">
              {stats.totalDiagrams}+
            </div>
            <div className="text-base text-gray-400 font-medium">
              Diagrams Generated
            </div>
          </div>

          <div className="bg-[#23272f] rounded-2xl shadow-md p-6 flex flex-col gap-2 border-l-4 border-purple-400/60 relative hover:shadow-lg transition group w-56 min-w-[12rem] max-w-[15rem]">
            <div className="absolute top-4 right-4">
              <Users className="w-7 h-7 text-purple-400" />
            </div>
            <div className="text-4xl font-extrabold text-white">
              {stats.totalUsers}+
            </div>
            <div className="text-base text-gray-400 font-medium">
              Active Users
            </div>
          </div>

          <div className="bg-[#23272f] rounded-2xl shadow-md p-6 flex flex-col gap-2 border-l-4 border-green-400/60 relative hover:shadow-lg transition group w-56 min-w-[12rem] max-w-[15rem]">
            <div className="absolute top-4 right-4">
              <Database className="w-7 h-7 text-green-400" />
            </div>
            <div className="text-4xl font-extrabold text-white">
              {stats.rowCount}+
            </div>
            <div className="text-base text-gray-400 font-medium">
              Code Chunks Indexed
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
