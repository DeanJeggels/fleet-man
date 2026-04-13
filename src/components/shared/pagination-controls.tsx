"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const rangeFrom = totalCount && pageSize ? (page - 1) * pageSize + 1 : null;
  const rangeTo = totalCount && pageSize ? Math.min(page * pageSize, totalCount) : null;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <p className="text-xs text-muted-foreground">
        {rangeFrom != null && rangeTo != null && totalCount != null
          ? `Showing ${rangeFrom}–${rangeTo} of ${totalCount}`
          : `Page ${page} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="cursor-pointer"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
