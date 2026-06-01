"use client";
import * as React from "react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { DashboardStats, Range } from "@/lib/analytics";

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All time" },
];

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

export function AnalyticsPanel({ qrId }: { qrId?: string }) {
  const [range, setRange] = React.useState<Range>("7d");
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (qrId) params.set("qr", qrId);
    fetch(`/api/stats?${params}`)
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .finally(() => setLoading(false));
  }, [range, qrId]);

  const devices = stats?.devices ?? {};
  const topCountries = Object.entries(stats?.countries ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Scan analytics</h2>
        <div className="inline-flex rounded-xl bg-secondary p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                range === r.id ? "bg-background text-foreground shadow" : "text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total scans" value={formatNumber(stats?.totalScans ?? 0)} />
        <Stat label="Unique scans" value={formatNumber(stats?.uniqueScans ?? 0)} />
        <Stat
          label="Mobile share"
          value={`${pct(devices.mobile, stats?.totalScans)}%`}
          sub={`${formatNumber(devices.mobile ?? 0)} mobile scans`}
        />
        <Stat label="Top country" value={topCountries[0]?.[0] ?? "—"} sub={topCountries[0] ? `${formatNumber(topCountries[0][1])} scans` : "no data yet"} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium">Scans over time</p>
          {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.series ?? []} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="scans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(263 85% 68%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(263 85% 68%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uniq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(330 85% 65%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(330 85% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 16%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(240 5% 60%)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "hsl(240 5% 60%)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(240 9% 7%)",
                  border: "1px solid hsl(240 5% 16%)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="scans" stroke="hsl(263 85% 68%)" strokeWidth={2} fill="url(#scans)" />
              <Area type="monotone" dataKey="unique" stroke="hsl(330 85% 65%)" strokeWidth={2} fill="url(#uniq)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-sm font-medium">Devices</p>
          <div className="space-y-2">
            {(["mobile", "desktop", "tablet"] as const).map((d) => (
              <Bar key={d} label={d} value={devices[d] ?? 0} total={stats?.totalScans ?? 0} />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-sm font-medium">Top countries</p>
          {topCountries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scans yet.</p>
          ) : (
            <div className="space-y-2">
              {topCountries.map(([c, v]) => (
                <Bar key={c} label={c} value={v} total={stats?.totalScans ?? 0} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function pct(value?: number, total?: number) {
  if (!value || !total) return 0;
  return Math.round((value / total) * 100);
}

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const p = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="tabular-nums">{formatNumber(value)} · {p}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-rose-500" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}
