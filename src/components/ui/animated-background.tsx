"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export const AnimatedBackground = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const maskSize = isHovered ? 500 : 300;
  const maskStyle = {
    WebkitMaskImage: `radial-gradient(${maskSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent)`,
    maskImage: `radial-gradient(${maskSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent)`,
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="pointer-events-none absolute inset-0 transition-opacity duration-500" 
        style={maskStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-sky-500/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900/0 to-transparent"></div>
        </div>
      </div>
      {children}
    </div>
  );
}; 