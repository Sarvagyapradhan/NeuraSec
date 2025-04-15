"use client";

import { cn } from "@/lib/utils";
import React, { createContext, useState, useContext, useRef, useEffect } from "react";

const MouseEnterContext = createContext<{
  mouseEnter: boolean;
  setMouseEnter: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  mouseEnter: false,
  setMouseEnter: () => {},
});

export const CardContainer = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseEnter, setMouseEnter] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 15;
    const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -15;

    setPosition({ x: rotateX, y: rotateY });
  };

  return (
    <MouseEnterContext.Provider value={{ mouseEnter, setMouseEnter }}>
      <div
        className={cn("flex items-center justify-center", containerClassName)}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          ref={containerRef}
          onMouseEnter={() => setMouseEnter(true)}
          onMouseLeave={() => {
            setMouseEnter(false);
            setPosition({ x: 0, y: 0 });
          }}
          onMouseMove={handleMouseMove}
          className={cn(
            "relative w-full h-full transition-transform duration-200 ease-out",
            className
          )}
          style={{
            transform: mouseEnter
              ? `rotateX(${position.x}deg) rotateY(${position.y}deg)`
              : "rotateX(0deg) rotateY(0deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "h-full w-full rounded-2xl border border-white/[0.1] bg-black p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardItem = ({
  children,
  className,
  translateZ = 0,
}: {
  children: React.ReactNode;
  className?: string;
  translateZ?: number;
}) => {
  const { mouseEnter } = useContext(MouseEnterContext);
  return (
    <div
      className={className}
      style={{
        transform: mouseEnter ? `translateZ(${translateZ}px)` : "none",
        transition: "transform 200ms ease",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}; 