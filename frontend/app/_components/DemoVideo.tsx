"use client";

import { useEffect, useRef, useState } from "react";

export function DemoVideo() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const loadPlayer = () => {
      if (iframeRef.current && !player) {
        const newPlayer = new (window as any).YT.Player(iframeRef.current, {
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
            },
          },
        });
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      (window as any).onYouTubeIframeAPIReady = loadPlayer;
    } else {
      loadPlayer();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (iframeRef.current) {
      observer.observe(iframeRef.current);
    }

    return () => {
      if (iframeRef.current) {
        observer.unobserve(iframeRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (player) {
      if (isInView) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [isInView, player]);

  return (
    <section className="relative w-full bg-black z-10 py-20 border-t border-t-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            See Thestral in Action
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="aspect-video bg-[#23272f] rounded-2xl border border-zinc-800 overflow-hidden">
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              title="Thestral Demo"
              src="https://www.youtube.com/embed/byyAqb5Hywo?enablejsapi=1&controls=0&mute=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&loop=1&playlist=byyAqb5Hywo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
