export function statusClass(status: string): string {
  switch (status) {
    case "approved":
    case "confirmed":
    case "received":
    case "sent":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "submitted":
    case "pending_approval":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
