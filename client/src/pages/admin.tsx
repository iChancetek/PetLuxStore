import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import AdminStats from "@/components/admin/admin-stats";
import ProductForm from "@/components/admin/product-form";
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
  AlertTriangle
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch admin stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Fetch products for management
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["/api/products", { limit: 50 }],
    enabled: isAuthenticated,
  });

  // Fetch recent orders
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: isAuthenticated,
  });

  const handleEditProduct = (product: any) => {
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
            Manage your store with AI-powered insights
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
        <Tabs defaultValue="products" className="mt-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-96">
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-tools" data-testid="tab-ai-tools">AI Tools</TabsTrigger>
          </TabsList>

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
                        {productsData?.products?.slice(0, 10).map((product: any) => (
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
                                variant={product.inStock > 10 ? "secondary" : product.inStock > 0 ? "outline" : "destructive"}
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

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
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
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders?.slice(0, 10).map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">Customer #{order.userId}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.billingAddress?.email || "No email"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${order.total}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  order.status === "delivered" ? "secondary" :
                                  order.status === "shipped" ? "outline" :
                                  order.status === "processing" ? "default" : "destructive"
                                }
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No orders found
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Sales Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced analytics dashboard coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    {stats?.lowStockProducts > 0 ? (
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
