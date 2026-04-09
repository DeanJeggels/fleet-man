"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const colorMap = {
  success: "border-l-[#22C55E]",
  warning: "border-l-[#F59E0B]",
  destructive: "border-l-[#EF4444]",
  accent: "border-l-[#3B82F6]",
} as const;

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  color?: keyof typeof colorMap;
  subtitle?: string;
  loading?: boolean;
}

function useCountUp(target: number, duration = 300) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setCurrent(target);
      return;
    }

    const start = performance.now();
    function animate(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return current;
}

export function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  color = "accent",
  subtitle,
  loading = false,
}: KPICardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value);
  const isNumeric = !isNaN(numericValue);
  const animatedValue = useCountUp(isNumeric ? numericValue : 0);

  if (loading) {
    return (
      <Card className={`border-l-4 ${colorMap[color]} p-4`}>
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="mb-1 h-8 w-20" />
        <Skeleton className="h-3 w-16" />
      </Card>
    );
  }

  return (
    <Card
      className={`border-l-4 ${colorMap[color]} p-4 transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 font-mono text-[32px] font-semibold leading-tight">
        {isNumeric ? animatedValue.toLocaleString() : value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
              trend >= 0
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </Card>
  );
}
