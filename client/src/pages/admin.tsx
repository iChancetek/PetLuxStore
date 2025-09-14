import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { activityTracker } from "@/lib/activityTracker";
import { SignIn } from "@clerk/clerk-react";
import type { AdminStats as AdminStatsType, ProductsResponse, Product, User } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import AdminStats from "@/components/admin/admin-stats";
import ProductForm from "@/components/admin/product-form";
import UsersTab from "@/components/admin/users-tab";
import OrdersTab from "@/components/admin/orders-tab";
import AnalyticsTab from "@/components/admin/analytics-tab";
import AuditLogsTab from "@/components/admin/audit-logs-tab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Sparkles, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  Users,
  Activity,
  Shield,
  BarChart3
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  // Fetch user profile to check admin role - MUST be called before any early returns
  const { data: userProfile, isLoading: loadingProfile, error: profileError } = useQuery<User>({
    queryKey: ["/api/me/profile"],
    enabled: isAuthenticated,
  });

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  // Fetch admin stats - MUST be called before any early returns
  const { data: stats, isLoading: loadingStats } = useQuery<AdminStatsType>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch products for management - MUST be called before any early returns
  const { data: productsData, isLoading: loadingProducts } = useQuery<ProductsResponse>({
    queryKey: ["/api/products", { limit: 50 }],
    enabled: isAuthenticated && isAdmin,
  });

  // Track admin dashboard access
  useEffect(() => {
    if (isAuthenticated && !isLoading && isAdmin) {
      activityTracker.trackAdminUI({
        action: 'dashboard_access',
        page: 'admin',
        initialTab: activeTab
      });
    }
  }, [isAuthenticated, isLoading, isAdmin]);

  // Track tab changes
  useEffect(() => {
    if (isAuthenticated && !isLoading && isAdmin) {
      activityTracker.trackAdminUI({
        action: 'tab_change',
        tab: activeTab,
        page: 'admin'
      });
    }
  }, [activeTab, isAuthenticated, isLoading, isAdmin]);

  // Show loading state while checking authentication and role
  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show sign in if not authenticated - AFTER all hooks are called
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Admin Access Required</h1>
            <p className="text-muted-foreground">Please sign in to access the admin dashboard</p>
          </div>
          <SignIn 
            routing="hash"
            afterSignInUrl="/admin"
            signUpUrl={undefined}
          />
        </div>
      </div>
    );
  }

  // Show access denied if authenticated but not admin role
  if (isAuthenticated && userProfile && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-access-denied-title">
                Access Denied
              </h1>
              <p className="text-muted-foreground mb-4" data-testid="text-access-denied-message">
                You don't have permission to access the admin dashboard.
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Role:</span>
                    <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'} data-testid="badge-current-role">
                      {userProfile.role || 'customer'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Required Role:</span>
                    <Badge variant="default">admin</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <p className="text-sm text-muted-foreground mt-6" data-testid="text-contact-admin">
              If you believe this is an error, please contact an administrator.
            </p>
            
            <Button 
              onClick={() => window.location.href = '/'}
              className="mt-4"
              data-testid="button-return-home"
            >
              Return to Home
            </Button>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  // Show error if profile failed to load
  if (profileError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-profile-error-title">
                Profile Error
              </h1>
              <p className="text-muted-foreground mb-4" data-testid="text-profile-error-message">
                Unable to verify your permissions. Please try again.
              </p>
            </div>
            
            <Button 
              onClick={() => window.location.reload()}
              data-testid="button-retry"
            >
              Try Again
            </Button>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsProductDialogOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-admin-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground" data-testid="text-admin-subtitle">
            Comprehensive platform management and analytics
          </p>
          <div className="flex items-center mt-4">
            <Badge className="bg-accent/10 text-accent">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Enhanced Store Management
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <AdminStats stats={stats} isLoading={loadingStats} />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="users" data-testid="tab-users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders" className="flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="audit-logs" data-testid="tab-audit-logs" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products" className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="ai-tools" data-testid="tab-ai-tools" className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <OrdersTab />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs" className="mt-6">
            <AuditLogsTab />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Product Management
                  </CardTitle>
                  <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleAddProduct} data-testid="button-add-product">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedProduct ? "Edit Product" : "Add New Product"}
                        </DialogTitle>
                      </DialogHeader>
                      <ProductForm 
                        product={selectedProduct} 
                        onClose={handleCloseDialog}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>AI Match</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsData?.products?.slice(0, 10).map((product: Product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={product.imageUrl || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div>
                                  <div className="font-medium" data-testid={`text-product-name-${product.id}`}>
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.petType || "All pets"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{product.brand || "Premium"}</TableCell>
                            <TableCell>${product.price}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={(product.inStock || 0) > 10 ? "secondary" : (product.inStock || 0) > 0 ? "outline" : "destructive"}
                                data-testid={`badge-stock-${product.id}`}
                              >
                                {product.inStock || 0} in stock
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {product.aiMatch ? (
                                <Badge className="bg-accent/10 text-accent">
                                  {product.aiMatch}%
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(`/product/${product.slug || product.id}`, '_blank')}
                                  data-testid={`button-view-${product.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  data-testid={`button-edit-${product.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-${product.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No products found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools" className="mt-6">
            <div className="grid gap-6">
              {/* AI Content Generator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Content Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Generate product descriptions, meta tags, and marketing copy using AI
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Button variant="outline" data-testid="button-generate-descriptions">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Product Descriptions
                      </Button>
                      <Button variant="outline" data-testid="button-generate-marketing">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Marketing Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Inventory Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.lowStockProducts && stats.lowStockProducts > 0 ? (
                      <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="font-medium">Low Stock Alert</span>
                        </div>
                        <Badge variant="destructive">
                          {stats.lowStockProducts} products
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>All products are well stocked</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="font-medium">Bulk Edit Inventory</div>
                        <div className="text-sm text-muted-foreground">Update stock levels in bulk</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="font-medium">Export Reports</div>
                        <div className="text-sm text-muted-foreground">Download sales and inventory reports</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="font-medium">AI Settings</div>
                        <div className="text-sm text-muted-foreground">Configure AI recommendation engine</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="font-medium">View Analytics</div>
                        <div className="text-sm text-muted-foreground">Deep dive into store performance</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}