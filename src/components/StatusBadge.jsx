const statusColor = {
  Present: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Late: "bg-amber-50 text-amber-700 border border-amber-200",
  Leave: "bg-rose-50 text-rose-700 border border-rose-200",
  "Early Leave": "bg-orange-50 text-orange-700 border border-orange-200",
};

export default function StatusBadge({ status }) {
  const style = statusColor[status] || "bg-slate-100 text-slate-700 border border-slate-200";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium tracking-wide ${style}`}>{status || "N/A"}</span>;
}
