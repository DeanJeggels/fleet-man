const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  maintenance: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  retired: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  sold: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-300" },
  inactive: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  suspended: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  service_due: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  service_overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  license_expiry: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  sync_failure: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  custom: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

const fallback = { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status] || fallback;
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
