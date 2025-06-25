"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CommitActivityChartProps {
  data: {
    name: string;
    date: string;
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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis allowDecimals={false} stroke="#6b7280" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="commits" fill="#18CCFC" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
