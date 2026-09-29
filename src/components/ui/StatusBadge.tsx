const TEXT_STYLES: Record<string, string> = {
  pending: "text-accent-strong",
  confirmed: "text-primary",
  "in progress": "text-primary",
  completed: "text-success",
  cancelled: "text-alert",
  open: "text-success",
  booked: "text-primary",
  unavailable: "text-muted",
  active: "text-success",
  suspended: "text-alert",
  rejected: "text-alert",
  unverified: "text-muted",
  verified: "text-success",
};

const DOT_STYLES: Record<string, string> = {
  pending: "bg-accent",
  confirmed: "bg-primary",
  "in progress": "bg-primary",
  completed: "bg-success",
  cancelled: "bg-alert",
  open: "bg-success",
  booked: "bg-primary",
  unavailable: "bg-muted",
  active: "bg-success",
  suspended: "bg-alert",
  rejected: "bg-alert",
  unverified: "bg-muted",
  verified: "bg-success",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${TEXT_STYLES[status] ?? "text-muted"}`}
    >
      <span className={`size-1.5 rounded-full ${DOT_STYLES[status] ?? "bg-muted"}`} aria-hidden />
      {status}
    </span>
  );
}
