"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundGradientProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BackgroundGradient({
  className,
  children,
  ...props
}: BackgroundGradientProps) {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-900/50 border border-white/10",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-violet-500/20 to-transparent"
        style={{
          maskImage: "radial-gradient(circle at center, transparent 0%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, transparent 0%, black 100%)",
        }}
      />
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundSize: "400% 400%",
        }}
        className={cn(
          "absolute inset-0 rounded-3xl opacity-60 group-hover:opacity-100 blur-xl transition duration-500",
          "bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]",
        )}
      />
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundSize: "400% 400%",
        }}
        className={cn(
          "absolute inset-0 rounded-3xl",
          "bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]",
        )}
      />
      {children}
    </div>
  );
} 