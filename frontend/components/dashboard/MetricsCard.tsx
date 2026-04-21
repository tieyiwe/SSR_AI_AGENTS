import { clsx } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  subtitle?: string;
};

export default function MetricsCard({ title, value, change, positive, subtitle }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>

      <div className="flex items-center gap-1 mt-2">
        {positive ? (
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
        )}
        <span
          className={clsx(
            "text-xs font-medium",
            positive ? "text-green-600" : "text-red-600"
          )}
        >
          {change}
        </span>
        {subtitle && <span className="text-xs text-gray-400 ml-1">{subtitle}</span>}
      </div>
    </div>
  );
}
