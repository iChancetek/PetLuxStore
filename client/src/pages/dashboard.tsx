import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import OrderHistoryTable from "@/components/dashboard/order-history-table";
import ActivityTimeline from "@/components/dashboard/activity-timeline";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  BarChart3, 
  ShoppingBag, 
  Activity, 
  Settings,
  Crown,
  Star
} from "lucide-react";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const defaultTab = urlParams.get('tab') || 'overview';

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: loadingStats } = useQuery<{
    totalOrders: number;
    totalSpent: number;
    lastPurchaseAt: string | null;
    thisMonthSpent: number;
    lastMonthSpent: number;
  }>({
    queryKey: ["/api/me/dashboard"],
    enabled: isAuthenticated,
  });

  // Track page view
  useEffect(() => {
    if (isAuthenticated) {
      // Track dashboard page view
      apiRequest("POST", "/api/activity/events", {
        type: "page_view",
        metadata: {
          page: "dashboard",
          url: "/dashboard"
        }
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  // Navigate to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Handle loading and auth states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-dashboard-title">
                Welcome back, {user?.firstName || 'there'}!
              </h1>
              <p className="text-muted-foreground text-lg" data-testid="text-dashboard-subtitle">
                Here's your personalized shopping overview
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile Badge */}
              <div className="flex items-center space-x-3 bg-card border rounded-lg p-3">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover"
                    data-testid="img-profile-avatar"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="font-medium" data-testid="text-user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || 'User'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-user-email">
                    {user?.email}
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">
                  <Crown className="w-3 h-3 mr-1" />
                  Member
                </Badge>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <DashboardStats stats={dashboardStats} isLoading={loadingStats} />
        </div>

        {/* Main Content */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2" data-testid="tab-orders">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2" data-testid="tab-activity">
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2" data-testid="tab-preferences">
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Orders Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>Recent Orders</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild data-testid="button-view-all-orders">
                    <a href="#" onClick={() => (document.querySelector('[data-testid="tab-orders"]') as HTMLElement)?.click()}>
                      View All
                    </a>
                  </Button>
                </CardHeader>
                <CardContent>
                  <OrderHistoryTable className="border-none shadow-none" />
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>Your Impact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Happy Pets Supported</p>
                        <p className="text-xs text-muted-foreground">Through your purchases</p>
                      </div>
                      <div className="text-2xl font-bold text-primary" data-testid="text-pets-supported">
                        {dashboardStats?.totalOrders || 0}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Member Since</p>
                        <p className="text-xs text-muted-foreground">Join date</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" data-testid="text-member-since">
                          {user?.id ? "2024" : "Today"}
                        </p>
                        <p className="text-xs text-muted-foreground">Loyal customer</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Favorite Category</p>
                        <p className="text-xs text-muted-foreground">Most purchased</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" data-testid="text-favorite-category">
                          Pet Food
                        </p>
                        <p className="text-xs text-muted-foreground">Premium quality</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild data-testid="button-view-all-activity">
                  <a href="#" onClick={() => (document.querySelector('[data-testid="tab-activity"]') as HTMLElement)?.click()}>
                    View All
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <ActivityTimeline className="border-none shadow-none" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <OrderHistoryTable />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <ActivityTimeline />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <ChangePasswordForm />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Additional Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2" data-testid="text-preferences-title">
                      More Preferences Coming Soon
                    </h3>
                    <p className="text-muted-foreground mb-4" data-testid="text-preferences-description">
                      We're working on additional account preferences and settings.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Email notifications</p>
                      <p>• Pet preferences</p>
                      <p>• AI recommendation settings</p>
                      <p>• Privacy controls</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Cards */}
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-shop-now">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Continue Shopping</h3>
                  <p className="text-sm text-muted-foreground">Discover new products for your pets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-ai-picks">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Recommendations</h3>
                  <p className="text-sm text-muted-foreground">Get personalized product suggestions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-support">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Customer Support</h3>
                  <p className="text-sm text-muted-foreground">Get help with your orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}