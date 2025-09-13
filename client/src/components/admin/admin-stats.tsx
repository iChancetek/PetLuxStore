import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Package, ShoppingCart, AlertTriangle } from "lucide-react";

interface AdminStatsProps {
  stats?: {
    totalRevenue: number;
    ordersToday: number;
    totalProducts: number;
    lowStockProducts: number;
  };
  isLoading: boolean;
}

export default function AdminStats({ stats, isLoading }: AdminStatsProps) {
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

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      change: "+12% vs last month",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      testId: "card-revenue"
    },
    {
      title: "Orders Today",
      value: stats?.ordersToday?.toString() || '0',
      change: "+8% vs yesterday",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      testId: "card-orders"
    },
    {
      title: "Total Products",
      value: stats?.totalProducts?.toString() || '0',
      change: "Active listings",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      testId: "card-products"
    },
    {
      title: "Low Stock Alert",
      value: stats?.lowStockProducts?.toString() || '0',
      change: "Items need restocking",
      icon: AlertTriangle,
      color: stats?.lowStockProducts && stats.lowStockProducts > 0 ? "text-red-600" : "text-gray-600",
      bgColor: stats?.lowStockProducts && stats.lowStockProducts > 0 ? "bg-red-100" : "bg-gray-100",
      testId: "card-low-stock"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} data-testid={stat.testId}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold" data-testid={`text-${stat.testId}-value`}>
                  {stat.value}
                </p>
                <div className="flex items-center space-x-1">
                  {stat.title === "Total Revenue" && (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  )}
                  <p className={`text-xs ${
                    stat.title === "Low Stock Alert" && stats?.lowStockProducts && stats.lowStockProducts > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
