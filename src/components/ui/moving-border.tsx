"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const MovingBorder = ({
  children,
  duration = 2000,
  rx = "20",
  className,
  containerClassName,
  borderClassName,
  as: Component = "div",
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: any;
}) => {
  return (
    <Component className={cn("relative", containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-lg",
            "bg-gradient-to-r from-violet-500 via-primary to-orange-500",
            borderClassName
          )}
        >
          <svg
            className="absolute w-full h-full"
            style={{ filter: "blur(40px)" }}
          >
            <rect
              width="100%"
              height="100%"
              rx={rx}
              fill="transparent"
              strokeWidth="20"
              stroke="url(#gradient)"
              strokeLinejoin="round"
            />
            <defs>
              <motion.linearGradient
                id="gradient"
                gradientUnits="userSpaceOnUse"
                animate={{
                  x1: ["0%", "100%"],
                  x2: ["100%", "0%"],
                }}
                transition={{
                  duration: duration / 1000,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <stop stopColor="#18CCFC" />
                <stop offset="0.5" stopColor="#6C47FF" />
                <stop offset="1" stopColor="#F4CAB1" />
              </motion.linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      <motion.div
        className={cn("relative", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </Component>
  );
}; 