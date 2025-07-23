"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CommitActivityChartProps {
  data: {
    name: string;
    commits: number;
  }[];
}

export function CommitActivityChart({ data }: CommitActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: 14 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 14 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "white",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            color: "#111827",
          }}
        />
        <Line
          type="monotone"
          dataKey="commits"
          stroke="#6366f1"
          strokeWidth={3}
          dot={{ r: 5, fill: "#6366f1", stroke: "white", strokeWidth: 2 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
