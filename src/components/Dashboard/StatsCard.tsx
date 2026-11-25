"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  change,
  trend = "neutral",
  icon: Icon,
  className = "",
}: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-700 bg-green-50 border-green-200";
      case "down":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card
      className={`overflow-hidden border-gray-200 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {change && (
              <div
                className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getTrendColor()}`}
              >
                {getTrendIcon()}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="rounded-xl bg-soft-green p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
