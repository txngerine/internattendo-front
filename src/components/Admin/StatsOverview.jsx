export function StatCard({ title, value, subtitle }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-text-muted">
        {title}
      </p>
      <h3 className="mt-1 text-3xl font-semibold tracking-tight text-text">
        {value}
      </h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

export default function StatsOverview({ attendanceRate, stats }) {
  return (
    <>
      <div
        className="card relative overflow-hidden p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.96) 60%, rgba(51,65,85,0.96) 100%)",
          borderColor: "#243247",
        }}
      >
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 right-16 h-48 w-48 rounded-full bg-slate-300/10 blur-2xl" />
        <div className="relative grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Today Attendance Rate</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{attendanceRate}%</p>
            <p className="mt-2 text-sm text-slate-300">Based on present, late, and early-leave interns.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Team Strength</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{stats.totalInterns || 0}</p>
            <p className="mt-2 text-sm text-slate-300">Registered interns currently managed.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Leave Count</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{stats.leaveToday || 0}</p>
            <p className="mt-2 text-sm text-slate-300">Interns marked as leave for today.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Interns" value={stats.totalInterns || 0} subtitle="active roster" />
        <StatCard title="Present Today" value={stats.presentToday || 0} subtitle="on-time check-ins" />
        <StatCard title="Late Today" value={stats.lateToday || 0} subtitle="after start threshold" />
        <StatCard title="On Leave" value={stats.leaveToday || 0} subtitle="outside attendance" />
        <StatCard title="Early Logout" value={stats.earlyLeaveToday || 0} subtitle="before end time" />
      </div>
    </>
  );
}
