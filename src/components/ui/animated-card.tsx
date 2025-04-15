"use client";

import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const AnimatedCard = ({
  children,
  className,
  containerClassName,
}: AnimatedCardProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 p-6 backdrop-blur-xl transition-all duration-500",
        containerClassName
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          background: isHovered
            ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.05), transparent 40%)`
            : "",
        }}
      />
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(180deg, rgba(29, 78, 216, 0.02) 0%, rgba(29, 78, 216, 0) 100%)",
          opacity: isHovered ? 1 : 0,
        }}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </motion.div>
  );
}; 