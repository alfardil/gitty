"use client";
import React, { useEffect } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function Button({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  as?: any;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <Component
      className={cn(
        "relative h-16 w-40 overflow-hidden bg-transparent p-[1px] text-xl",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "h-20 w-20 bg-[radial-gradient(#0ea5e9_40%,transparent_60%)] opacity-[0.8]",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>

      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center border border-slate-800 bg-slate-900/[0.8] text-sm text-white antialiased backdrop-blur-xl",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 3000,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: any;
}) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);
  const [pathLength, setPathLength] = React.useState<number | null>(null);
  const [dimensions, setDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  // Update path length and dimensions when the component mounts or resizes
  useEffect(() => {
    const updatePathLength = () => {
      if (pathRef.current) {
        try {
          const rect = pathRef.current.getBoundingClientRect();
          // Only update if the dimensions are valid (greater than minimum size)
          if (rect.width > 10 && rect.height > 10) {
            setDimensions({ width: rect.width, height: rect.height });
            const length = pathRef.current.getTotalLength();
            setPathLength(length > 0 ? length : null);
          } else {
            setPathLength(null);
          }
        } catch (e) {
          console.warn("SVG rect measurement failed:", e);
          setPathLength(null);
        }
      }
    };

    // Initial measurement
    updatePathLength();

    // Add resize listener
    const resizeObserver = new ResizeObserver(updatePathLength);
    if (pathRef.current) {
      resizeObserver.observe(pathRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useAnimationFrame((time) => {
    if (pathLength && pathLength > 0) {
      const pxPerMillisecond = pathLength / duration;
      progress.set((time * pxPerMillisecond) % pathLength);
    }
  });

  const getPointAtLength = (val: number) => {
    if (!pathRef.current || !pathLength || pathLength <= 0 || !dimensions) {
      return { x: 0, y: 0 };
    }
    try {
      return pathRef.current.getPointAtLength(val);
    } catch (e) {
      return { x: 0, y: 0 };
    }
  };

  const x = useTransform(progress, (val) => getPointAtLength(val).x);
  const y = useTransform(progress, (val) => getPointAtLength(val).y);

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        style={{ minWidth: "20px", minHeight: "20px" }}
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      {pathLength && pathLength > 0 && dimensions && (
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "inline-block",
            transform,
          }}
        >
          {children}
        </motion.div>
      )}
    </>
  );
};
