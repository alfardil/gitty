"use client";

export function DemoVideo() {
  return (
    <section className="relative w-full bg-black z-10 px-4 py-20 border-t border-t-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            See DevBoard in Action
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="aspect-video bg-[#23272f] rounded-2xl border border-zinc-800 overflow-hidden">
            <video
              ref={(el) => {
                if (el) {
                  const observer = new IntersectionObserver(
                    (entries) => {
                      entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                          el.play().catch(() => {});
                        } else {
                          el.pause();
                        }
                      });
                    },
                    { threshold: 0.5 }
                  );
                  observer.observe(el);
                }
              }}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            >
              <source src="/output-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
