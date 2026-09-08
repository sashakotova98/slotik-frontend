import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, } from "recharts";

type Props = {
  dailyRevenue: { day: number; amount: number }[];
};

export default function RevenueChart({ dailyRevenue }: Props) {
  if (dailyRevenue.length === 0) {
    return (
      <p className="text-sm text-muted">
        Поки немає даних для графіка.
      </p>
    );
  }

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dailyRevenue}
          margin={{ top: 10, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--color-border)"
          />

          <XAxis
            dataKey="day"
            tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            stroke="var(--color-border)"
          />

          <YAxis
            domain={[0, (dataMax: number) => Math.max(300, dataMax + 100)]}
            width={65}
            tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            stroke="var(--color-border)"
            tickFormatter={(value) => `${value} ₴`}
          />

          <Tooltip
            labelFormatter={(day) => `День ${day}`}
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderRadius: 10,
              color: "var(--color-text)",
            }}
          />

          <Line
            type="monotone"
            dataKey="amount"
            name="Дохід"
            unit=" ₴"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={dailyRevenue.length === 1}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}