"use client";

import { useState, useEffect } from "react";

export function MissionsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("missions-section");
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const missions = [
    {
      id: "01",
      title: "Intelligence Extraction",
      description: "Pattern recognition and data synthesis for enhanced awareness.",
      status: "Active"
    },
    {
      id: "02", 
      title: "Decision Architecture",
      description: "Strategic frameworks for systematic operational control.",
      status: "Active"
    },
    {
      id: "03",
      title: "Strategic Coordination",
      description: "Resource optimization and team synchronization protocols.",
      status: "Pending"
    },
    {
      id: "04",
      title: "Operational Dominance",
      description: "Continuous monitoring for superior efficiency outcomes.",
      status: "Classified"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "text-green-400 border-green-400/20 bg-green-400/10";
      case "Pending": return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
      case "Classified": return "text-red-400 border-red-400/20 bg-red-400/10";
      default: return "text-white/60 border-white/20 bg-white/10";
    }
  };

  return (
    <section 
      id="missions-section"
      className="relative w-full min-h-screen flex items-center justify-center bg-[#0a0a0a] z-10 px-4 py-20"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section indicator */}
        <div className="flex items-center justify-center mb-16 opacity-60">
          <div className="w-16 h-px bg-white/30"></div>
          <span className="mx-4 text-white/60 text-sm tracking-widest">[MISSION]</span>
          <div className="w-16 h-px bg-white/30"></div>
        </div>

        {/* Main content */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            Mission
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              Control
            </span>
          </h2>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Operational parameters for enhanced decision dominance and strategic superiority.
          </p>
        </div>

        {/* Missions grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {missions.map((mission, index) => (
            <div
              key={mission.id}
              className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 transition-all duration-1000 delay-${index * 200} hover:bg-white/10 hover:border-white/20 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
                              {/* Mission header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-white/40">{mission.id}</span>
                    <div className={`px-2 py-1 border rounded text-xs font-medium ${getStatusColor(mission.status)}`}>
                      {mission.status}
                    </div>
                  </div>
                  <div className="w-6 h-6 border border-white/20 rounded-full flex items-center justify-center group-hover:border-white/40 transition-colors">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full group-hover:bg-white transition-colors"></div>
                  </div>
                </div>

                {/* Mission content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors">
                  {mission.title}
                </h3>
                
                <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                  {mission.description}
                </p>

                {/* Mission indicator */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <span className="text-white/40 text-xs ml-2">CLASSIFIED</span>
                </div>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className={`text-center mt-12 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-black text-white">04</div>
              <div className="text-white/60 text-xs">ACTIVE</div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">∞</div>
              <div className="text-white/60 text-xs">SCALE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">AI</div>
              <div className="text-white/60 text-xs">ENABLED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual design elements */}
      <div className={`absolute top-1/6 left-1/12 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent border border-white/10 transition-all duration-1000 delay-300 pointer-events-none ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}></div>
      <div className={`absolute top-1/3 right-1/12 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent border border-white/10 transition-all duration-1000 delay-500 pointer-events-none ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}></div>
      <div className={`absolute bottom-1/4 left-1/6 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent border border-white/10 rounded-full transition-all duration-1000 delay-700 pointer-events-none ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}></div>
      
      {/* Subtle grid overlay for depth */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px'
      }} />
    </section>
  );
}
