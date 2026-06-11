import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
}

export function StatCard({ label, value, className, valueClassName }: StatCardProps) {
  return (
    <Card className={cn("border-t-2 border-t-primary bg-card", className)}>
      <CardContent className="p-6">
        <div className="text-sm font-condensed uppercase tracking-widest text-muted-foreground mb-2">
          {label}
        </div>
        <div className={cn("text-4xl font-condensed font-bold", valueClassName)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
