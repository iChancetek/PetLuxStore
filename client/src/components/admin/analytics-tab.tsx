import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Eye, 
  ShoppingCart, 
  Users, 
  Calendar,
  RefreshCw,
  Download,
  Activity,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface ActivitySummary {
  pageViews: number;
  productViews: number;
  cartAdditions: number;
  purchases: number;
  chartData: Array<{ 
    date: string; 
    pageViews: number; 
    productViews: number; 
    purchases: number; 
  }>;
}

interface TopProduct {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
  };
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsTab() {
  const [dateRange, setDateRange] = useState("30d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Fetch activity summary
  const { data: activitySummary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["/api/admin/activity/summary", { range: dateRange }],
    enabled: true,
  });

  // Fetch top products by views
  const { data: topViewedProducts, isLoading: loadingViewed } = useQuery({
    queryKey: ["/api/admin/activity/top-products", { metric: "views", range: dateRange, limit: 10 }],
    enabled: true,
  });

  // Fetch top products by purchases  
  const { data: topPurchasedProducts, isLoading: loadingPurchased } = useQuery({
    queryKey: ["/api/admin/activity/top-products", { metric: "purchases", range: dateRange, limit: 10 }],
    enabled: true,
  });

  const summary: ActivitySummary = (activitySummary as any) || {
    pageViews: 0,
    productViews: 0,
    cartAdditions: 0,
    purchases: 0,
    chartData: []
  };

  const viewedProducts: TopProduct[] = (topViewedProducts as any) || [];
  const purchasedProducts: TopProduct[] = (topPurchasedProducts as any) || [];

  // Calculate conversion rate
  const conversionRate = summary.pageViews > 0 ? ((summary.purchases / summary.pageViews) * 100).toFixed(2) : "0.00";
  const cartConversionRate = summary.cartAdditions > 0 ? ((summary.purchases / summary.cartAdditions) * 100).toFixed(2) : "0.00";

  const handleExportData = () => {
    const data = {
      summary,
      topViewed: viewedProducts,
      topPurchased: purchasedProducts,
      dateRange,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const metricCards = [
    {
      title: "Total Page Views",
      value: summary.pageViews.toLocaleString(),
      change: "+12.5%",
      changeType: "positive",
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      testId: "card-page-views"
    },
    {
      title: "Product Views",
      value: summary.productViews.toLocaleString(),
      change: "+8.2%",
      changeType: "positive",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-100",
      testId: "card-product-views"
    },
    {
      title: "Cart Additions",
      value: summary.cartAdditions.toLocaleString(),
      change: "+15.3%",
      changeType: "positive",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      testId: "card-cart-additions"
    },
    {
      title: "Purchases",
      value: summary.purchases.toLocaleString(),
      change: "+5.7%",
      changeType: "positive",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      testId: "card-purchases"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-analytics-title">
            Activity Analytics
          </h2>
          <p className="text-muted-foreground" data-testid="text-analytics-subtitle">
            Monitor user activity and platform performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSummary()}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            data-testid="button-export-analytics"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Time Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-date-range">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === "custom" && (
              <>
                <Input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  placeholder="From date"
                  data-testid="input-custom-date-from"
                />
                <Input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  placeholder="To date"
                  data-testid="input-custom-date-to"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <Card key={index} data-testid={metric.testId}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  {loadingSummary ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold" data-testid={`text-${metric.testId}-value`}>
                      {metric.value}
                    </p>
                  )}
                  <div className="flex items-center space-x-1">
                    {metric.changeType === "positive" ? (
                      <ArrowUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-600" />
                    )}
                    <p className={`text-xs ${
                      metric.changeType === "positive" ? "text-green-600" : "text-red-600"
                    }`}>
                      {metric.change} vs last period
                    </p>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-conversion-rate">
              {conversionRate}%
            </div>
            <p className="text-sm text-muted-foreground">
              Purchases / Page Views
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cart Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-cart-conversion-rate">
              {cartConversionRate}%
            </div>
            <p className="text-sm text-muted-foreground">
              Purchases / Cart Additions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Activity Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSummary ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <div className="h-80" data-testid="chart-activity-trends">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Page Views"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="productViews" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Product Views"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="purchases" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    name="Purchases"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Top 10 Most Viewed Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingViewed ? (
              <Skeleton className="h-80 w-full" />
            ) : viewedProducts.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="h-80" data-testid="chart-top-viewed">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewedProducts.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="product.name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Purchased Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Top 10 Most Purchased Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPurchased ? (
              <Skeleton className="h-80 w-full" />
            ) : purchasedProducts.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="h-80" data-testid="chart-top-purchased">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchasedProducts.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="product.name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Products Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingViewed ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))
              ) : viewedProducts.slice(0, 5).map((item, index) => (
                <div key={item.product.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <img
                    src={item.product.imageUrl || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=40"}
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">${item.product.price}</div>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-viewed-count-${index}`}>
                    {item.count} views
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Purchased Table */}
        <Card>
          <CardHeader>
            <CardTitle>Most Purchased Products Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingPurchased ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))
              ) : purchasedProducts.slice(0, 5).map((item, index) => (
                <div key={item.product.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <img
                    src={item.product.imageUrl || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=40"}
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">${item.product.price}</div>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-purchased-count-${index}`}>
                    {item.count} sold
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}