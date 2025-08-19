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
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#ffffff" 
          strokeOpacity={0.1}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickMargin={10}
        />
        <Tooltip
          contentStyle={{
            background: "#0a0a0a",
            borderRadius: 8,
            border: "1px solid #ffffff20",
            color: "#ffffff",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
          labelStyle={{
            color: "#ffffff80",
            fontSize: "11px",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        />
        <Line
          type="monotone"
          dataKey="commits"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ 
            r: 4, 
            fill: "#3b82f6", 
            stroke: "#0a0a0a", 
            strokeWidth: 2 
          }}
          activeDot={{ 
            r: 6,
            fill: "#60a5fa",
            stroke: "#0a0a0a",
            strokeWidth: 2
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
