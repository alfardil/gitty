import { useEffect, useRef } from "react";

export const StarfieldBackground = ({ className = "" }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const stars = useRef<{ x: number; y: number; z: number; o: number; r: number; c: string }[]>([]);
  const STAR_COLORS = ["#fff", "#a259ff", "#6e1fff", "#c7bfff"];
  const STAR_COUNT = 120;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      if (!canvas) return { width: 0, height: 0 };
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
      return { width, height };
    }

    let { width, height } = resizeCanvas();

    // Initialize stars
    stars.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * width,
      o: 0.7 + Math.random() * 0.3,
      r: 0.7 + Math.random() * 1.3,
      c: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));

    const animate = () => {
      if (!canvas || !ctx) return;
      // Always update canvas size to match parent
      const newWidth = canvas.clientWidth;
      const newHeight = canvas.clientHeight;
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        width = newWidth;
        height = newHeight;
      }
      ctx.clearRect(0, 0, width, height);
      for (let star of stars.current) {
        star.z -= 1.2;
        if (star.z <= 0) {
          star.x = Math.random() * width;
          star.y = Math.random() * height;
          star.z = width;
        }
        const k = 128.0 / star.z;
        const sx = star.x * k + width / 2 - width / 2 * k;
        const sy = star.y * k + height / 2 - height / 2 * k;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        ctx.save();
        ctx.globalAlpha = star.o;
        ctx.beginPath();
        ctx.arc(sx, sy, star.r * (1.5 - star.z / width), 0, 2 * Math.PI);
        ctx.fillStyle = star.c;
        ctx.shadowColor = star.c;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={"pointer-events-none w-full h-full " + className}
      style={{ position: "absolute", inset: 0, zIndex: 0, background: "transparent" }}
    />
  );
}; 