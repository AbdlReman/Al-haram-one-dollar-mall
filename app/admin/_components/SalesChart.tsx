"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPkr } from "@/lib/formatCurrency";

export type ChartOrderPoint = { createdAt: string; totalAmount: number };

type RangeKey = "7d" | "28d" | "life";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDailySeries(orders: ChartOrderPoint[], dayCount: number) {
  const today = startOfDay(new Date());
  const series: { label: string; revenue: number }[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toYMD(d);
    const revenue = orders.reduce((sum, o) => {
      const od = startOfDay(new Date(o.createdAt));
      if (Number.isNaN(od.getTime())) return sum;
      return toYMD(od) === key ? sum + Number(o.totalAmount || 0) : sum;
    }, 0);
    series.push({
      label: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`,
      revenue,
    });
  }
  return series;
}

function buildMonthlySeries(orders: ChartOrderPoint[]) {
  const map = new Map<string, number>();
  for (const o of orders) {
    const dt = new Date(o.createdAt);
    if (Number.isNaN(dt.getTime())) continue;
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    map.set(ym, (map.get(ym) || 0) + Number(o.totalAmount || 0));
  }
  const keys = Array.from(map.keys()).sort();
  if (keys.length === 0) return [{ label: "—", revenue: 0 }];
  return keys.map((ym) => ({
    label: ym,
    revenue: map.get(ym) || 0,
  }));
}

function aggregate(orders: ChartOrderPoint[], range: RangeKey) {
  if (range === "7d") return buildDailySeries(orders, 7);
  if (range === "28d") return buildDailySeries(orders, 28);
  return buildMonthlySeries(orders);
}

const axisTick = { fill: "#94a3b8", fontSize: 11 };
const gridStroke = "#334155";

export default function SalesChart({ orders }: { orders: ChartOrderPoint[] }) {
  const [range, setRange] = useState<RangeKey>("7d");
  const data = useMemo(() => aggregate(orders, range), [orders, range]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Sales revenue</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
          className="bg-slate-900 border border-slate-600 text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          aria-label="Chart time range"
        >
          <option value="7d">Last 7 days</option>
          <option value="28d">Last 28 days</option>
          <option value="life">Lifetime (by month)</option>
        </select>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        {range === "life"
          ? "Total revenue grouped by calendar month across all orders."
          : "Total revenue per day for the selected window."}
      </p>
      <div className="h-64 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
            <defs>
              <linearGradient id="adminSalesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              interval={range === "28d" ? 3 : 0}
              angle={range === "28d" ? -35 : 0}
              textAnchor={range === "28d" ? "end" : "middle"}
              height={range === "28d" ? 48 : 28}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              tickFormatter={(v) => formatPkr(Number(v))}
              width={76}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #475569",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#e2e8f0",
              }}
              formatter={(value) => [formatPkr(Number(value ?? 0)), "Revenue"]}
              labelFormatter={(label) => (range === "life" ? `Month ${label}` : `Date ${label}`)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#a5b4fc"
              strokeWidth={2}
              fill="url(#adminSalesFill)"
              dot={{ r: 3, fill: "#818cf8", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
