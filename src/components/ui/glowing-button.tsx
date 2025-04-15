"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const GlowingButton = ({
  children,
  className,
  containerClassName,
  glowClassName,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  glowClassName?: string;
  onClick?: () => void;
}) => {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        containerClassName
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-xl transition-all duration-500",
          "bg-gradient-to-r from-primary via-violet-500 to-orange-500 opacity-75 group-hover:opacity-100",
          glowClassName
        )}
      />
      <button
        className={cn(
          "relative inline-flex items-center justify-center px-8 py-3 text-lg",
          "font-medium text-white transition-all duration-200",
          "rounded-full bg-neutral-950 border border-neutral-800",
          "hover:bg-neutral-900 hover:border-neutral-700 hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "active:scale-95",
          className
        )}
      >
        {children}
      </button>
    </div>
  );
}; 