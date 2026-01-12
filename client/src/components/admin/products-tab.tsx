import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductForm from "./product-form";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Archive,
  RotateCcw,
  AlertTriangle
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: string;
  originalPrice?: string;
  categoryId?: string;
  brand?: string;
  imageUrl?: string;
  inStock: number;
  petType?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProductsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const limit = 20;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: productsData, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["/api/admin/products", { 
      search, 
      status: statusFilter !== "all" ? statusFilter : undefined,
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      stockStatus: stockFilter !== "all" ? stockFilter : undefined,
      page, 
      limit 
    }],
    enabled: true,
  });

  const archiveProductMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${productId}`, { isActive });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Product ${variables.isActive ? 'restored' : 'archived'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductToArchive(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleArchiveProduct = (product: Product) => {
    archiveProductMutation.mutate({ productId: product.id, isActive: false });
  };

  const handleRestoreProduct = (product: Product) => {
    archiveProductMutation.mutate({ productId: product.id, isActive: true });
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const total = productsData?.total || 0;

  const getStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Archived</Badge>;
    }
    if (product.inStock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.inStock <= 10) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>;
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">{stock}</Badge>;
    }
    if (stock <= 10) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">{stock}</Badge>;
    }
    return <Badge variant="secondary">{stock}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Product Management
            {total > 0 && (
              <Badge variant="secondary" className="ml-2">{total} products</Badge>
            )}
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm onClose={handleCloseCreateDialog} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={(value) => { setStockFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-stock-filter">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock (≤10)</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all" || categoryFilter !== "all" || stockFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first product"}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className={!product.isActive ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img 
                              src={product.imageUrl || "/placeholder-product.jpg"}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=48&h=48&fit=crop";
                              }}
                            />
                            <div>
                              <div className="font-medium max-w-[200px] truncate" data-testid={`text-product-name-${product.id}`}>
                                {product.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {product.petType || "All pets"} • SKU: {product.slug}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {categories?.find(c => c.id === product.categoryId)?.name || product.brand || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${product.price}</div>
                          {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                            <div className="text-sm text-muted-foreground line-through">
                              ${product.originalPrice}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStockBadge(product.inStock || 0)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/product/${product.slug || product.id}`, '_blank')}
                              title="View product"
                              data-testid={`button-view-${product.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              title="Edit product"
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            {product.isActive ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Archive product"
                                    disabled={archiveProductMutation.isPending}
                                    data-testid={`button-archive-${product.id}`}
                                  >
                                    <Archive className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Archive Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to archive "{product.name}"? 
                                      Archived products will be hidden from the store but can be restored later.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={archiveProductMutation.isPending}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleArchiveProduct(product)}
                                      disabled={archiveProductMutation.isPending}
                                      className="bg-amber-600 hover:bg-amber-700"
                                    >
                                      {archiveProductMutation.isPending ? "Archiving..." : "Archive"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Restore product"
                                    disabled={archiveProductMutation.isPending}
                                    className="text-green-600 hover:text-green-700"
                                    data-testid={`button-restore-${product.id}`}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restore Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to restore "{product.name}"? 
                                      This will make the product visible in the store again.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={archiveProductMutation.isPending}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRestoreProduct(product)}
                                      disabled={archiveProductMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {archiveProductMutation.isPending ? "Restoring..." : "Restore"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  title="Delete product"
                                  disabled={deleteProductMutation.isPending}
                                  data-testid={`button-delete-${product.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                    Delete Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="space-y-2">
                                    <p>Are you sure you want to delete "{product.name}"?</p>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      This product will be recoverable for 60 days. After 60 days, it will be permanently removed.
                                    </p>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={deleteProductMutation.isPending}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    disabled={deleteProductMutation.isPending}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} products
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm product={selectedProduct} onClose={handleCloseEditDialog} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
