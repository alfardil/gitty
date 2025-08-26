"use client";

import { useState, useEffect } from "react";

export function VideoSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("video-section");
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const handleVideoClick = () => {
    const video = document.getElementById("demo-video") as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
  };

  return (
    <section
      id="video-section"
      className="relative w-full min-h-screen flex items-center justify-center bg-[#0a0a0a] z-10 px-4"
    >
      <div className="max-w-7xl mx-auto text-center">
        {/* Section indicator */}
        <div className="flex items-center justify-center mb-16 opacity-60">
          <div className="w-16 h-px bg-white/30"></div>
          <span className="mx-4 text-white/60 text-sm tracking-widest">
            [0.1]
          </span>
          <div className="w-16 h-px bg-white/30"></div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Text content */}
          <div className="text-left space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Operating System for
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                Startup Intelligence
              </span>
            </h2>

            <div className="space-y-6 text-white/70 text-lg leading-relaxed">
              <p>
                Thestral&apos;s intelligence platform empowers founders with
                AI-driven insights, seamless team coordination, and strategic
                decision-making capabilities.
              </p>
              <p>
                Experience enhanced situational awareness as Thestral
                streamlines critical operations in the modern startup landscape.
              </p>
            </div>

            {/* Action elements */}
            <div className="flex flex-col sm:flex-row gap-8 pt-6 items-start">
              {/* Code-like demo indicator */}
              <div className="font-mono text-white/60 text-base">
                <span className="text-white/40">{"{"}</span>
                <span className="text-white/70 mx-2">WATCH DEMO</span>
                <span className="text-white/40">{"}"}</span>
              </div>

              <button
                onClick={() => {
                  const missionsSection =
                    document.getElementById("missions-section");
                  if (missionsSection) {
                    missionsSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="px-8 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                LEARN MORE
              </button>
            </div>
          </div>

          {/* Right side - Video player */}
          <div className="relative">
            <div className="relative w-full max-w-2xl mx-auto">
              <div
                className="relative aspect-video bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden cursor-pointer group"
                onClick={handleVideoClick}
              >
                {/* Subtle grid overlay - behind video */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none z-0"
                  style={{
                    backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Video element */}
                <video
                  id="demo-video"
                  className="w-full h-full object-cover relative z-10"
                  onEnded={handleVideoEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedData={handleVideoLoaded}
                  preload="metadata"
                >
                  <source src="/Roadmap_Demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Play button overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all duration-300 z-20">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/80 text-sm font-medium tracking-wide">
                          VIDEO DEMO
                        </p>
                        <p className="text-white/60 text-xs">
                          AI-Powered Startup Intelligence
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating elements */}
              <div
                className={`absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent border border-white/10 transform transition-all duration-1000 pointer-events-none ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              />
              <div
                className={`absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent border border-white/10 transform transition-all duration-1000 delay-300 pointer-events-none ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              />
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-center mt-16 opacity-60">
          <div className="w-16 h-px bg-white/30"></div>
          <span className="mx-4 text-white/60 text-sm tracking-widest">
            [0.2]
          </span>
          <div className="w-16 h-px bg-white/30"></div>
        </div>
      </div>
    </section>
  );
}
