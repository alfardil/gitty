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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="font-medium text-gray-900">{formattedDate}</p>
        <p className="text-gray-600">{`${payload[0].value} commit${
          payload[0].value !== 1 ? "s" : ""
        }`}</p>
      </div>
    );
  }
  return null;
};

export function CommitActivityChart({ data }: CommitActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#a259ff" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#c7bfff", fontSize: 14 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#c7bfff", fontSize: 14 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(110,31,255,0.95)",
            borderRadius: 12,
            border: "1px solid #a259ff",
            color: "#fff",
            boxShadow: "0 4px 24px 0 #6e1fff44"
          }}
          itemStyle={{ color: "#fff" }}
          labelStyle={{ color: "#fff" }}
        />
        <Line
          type="monotone"
          dataKey="commits"
          stroke="url(#purple-gradient)"
          strokeWidth={4}
          dot={{ r: 6, fill: "#a259ff", stroke: "#fff", strokeWidth: 2, filter: "drop-shadow(0 2px 8px #a259ff88)" }}
          activeDot={{ r: 8, fill: "#6e1fff", stroke: "#fff", strokeWidth: 2, filter: "drop-shadow(0 2px 12px #6e1fff88)" }}
        />
        <defs>
          <linearGradient id="purple-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a259ff" />
            <stop offset="50%" stopColor="#6e1fff" />
            <stop offset="100%" stopColor="#2d006b" />
          </linearGradient>
        </defs>
      </LineChart>
    </ResponsiveContainer>
  );
}
