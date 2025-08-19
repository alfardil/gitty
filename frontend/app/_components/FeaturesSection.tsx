"use client";

import { Code, Search, Users } from "lucide-react";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative w-full bg-black z-10 px-4 py-40 min-h-[100vh]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Why Choose Thestral?
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Transform how your development team understands, navigates, and
            contributes to your codebase
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#23272f] rounded-2xl shadow-md p-6 flex flex-col gap-2 border-l-4 border-blue-400/60 relative hover:shadow-lg transition group">
            <div className="absolute top-4 right-4">
              <Code className="w-7 h-7 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-4 text-white">
                Instant Codebase Understanding
              </h3>
              <p className="text-white/70 leading-relaxed">
                Get new developers up to speed in minutes, not weeks. Our AI
                analyzes your entire codebase to provide instant context and
                architectural insights.
              </p>
            </div>
          </div>

          <div className="bg-[#23272f] rounded-2xl shadow-md p-6 flex flex-col gap-2 border-l-4 border-purple-400/60 relative hover:shadow-lg transition group">
            <div className="absolute top-4 right-4">
              <Search className="w-7 h-7 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-4 text-white">
                Smart Code Search
              </h3>
              <p className="text-white/70 leading-relaxed">
                Find exactly what you&apos;re looking for with natural language
                queries. Search by functionality, not just keywords, and
                discover related code patterns instantly.
              </p>
            </div>
          </div>

          <div className="bg-[#23272f] rounded-2xl shadow-md p-6 flex flex-col gap-2 border-l-4 border-pink-400/60 relative hover:shadow-lg transition group">
            <div className="absolute top-4 right-4">
              <Users className="w-7 h-7 text-pink-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-4 text-white">
                Team Collaboration Hub
              </h3>
              <p className="text-white/70 leading-relaxed">
                Bridge the knowledge gap between senior and junior developers.
                Share insights, document decisions, and maintain institutional
                knowledge effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
