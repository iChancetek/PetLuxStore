import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingBag, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface DashboardStatsProps {
  stats?: {
    totalOrders: number;
    totalSpent: number;
    lastPurchaseAt: string | null;
    thisMonthSpent: number;
    lastMonthSpent: number;
  };
  isLoading: boolean;
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate spending trend
  const spendingTrend = stats?.thisMonthSpent && stats?.lastMonthSpent 
    ? ((stats.thisMonthSpent - stats.lastMonthSpent) / stats.lastMonthSpent) * 100
    : 0;

  const isPositiveTrend = spendingTrend > 0;
  const trendText = Math.abs(spendingTrend).toFixed(1);

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders?.toString() || '0',
      description: "All time purchases",
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      testId: "card-total-orders"
    },
    {
      title: "Total Spent",
      value: `$${stats?.totalSpent?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      description: "Lifetime spending",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      testId: "card-total-spent"
    },
    {
      title: "This Month",
      value: `$${stats?.thisMonthSpent?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      description: spendingTrend === 0 ? "Current month" : `${isPositiveTrend ? '+' : '-'}${trendText}% vs last month`,
      icon: TrendingUp,
      color: isPositiveTrend ? "text-green-600" : "text-red-600",
      bgColor: isPositiveTrend ? "bg-green-100" : "bg-red-100",
      testId: "card-monthly-spent"
    },
    {
      title: "Last Purchase",
      value: stats?.lastPurchaseAt 
        ? format(new Date(stats.lastPurchaseAt), 'MMM d, yyyy')
        : 'No purchases yet',
      description: stats?.lastPurchaseAt 
        ? format(new Date(stats.lastPurchaseAt), 'h:mm a')
        : 'Start shopping to see your first purchase',
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      testId: "card-last-purchase"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} data-testid={stat.testId}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold break-words" data-testid={`text-${stat.testId}-value`}>
                  {stat.value}
                </p>
                <div className="flex items-center space-x-1">
                  {stat.title === "This Month" && spendingTrend !== 0 && (
                    <TrendingUp className={`w-3 h-3 ${stat.color}`} />
                  )}
                  <p className={`text-xs text-muted-foreground`}>
                    {stat.description}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor} flex-shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}