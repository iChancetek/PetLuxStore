import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProductCard from "@/components/product/product-card";
import ProductFilters from "@/components/product/product-filters";
import ChatAssistant from "@/components/ai/chat-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Brain, Sparkles } from "lucide-react";

export default function Shop() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Extract filters from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const [filters, setFilters] = useState({
    categoryId: urlParams.get('categoryId') || '',
    petType: urlParams.get('petType') || '',
    minPrice: urlParams.get('minPrice') ? Number(urlParams.get('minPrice')) : undefined,
    maxPrice: urlParams.get('maxPrice') ? Number(urlParams.get('maxPrice')) : undefined,
    search: urlParams.get('search') || '',
    inStock: urlParams.get('inStock') === 'true',
    sortBy: (urlParams.get('sortBy') as 'price' | 'rating' | 'created' | 'ai_match') || 'created',
    sortOrder: (urlParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 24;

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

  // Fetch products with filters
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["/api/products", { 
      ...filters, 
      page: currentPage, 
      limit: productsPerPage 
    }],
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

  // Fetch categories for filters
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({ 
      ...prev, 
      sortBy: sortBy as 'price' | 'rating' | 'created' | 'ai_match',
      sortOrder: sortOrder as 'asc' | 'desc'
    }));
    setCurrentPage(1);
  };

  const totalProducts = productsData?.total || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const products = productsData?.products || [];

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
      
      {/* Header */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold mb-4" data-testid="text-shop-title">
              Premium Pet Products
            </h1>
            <p className="text-muted-foreground text-lg" data-testid="text-shop-subtitle">
              Discover the perfect products for your beloved companions
            </p>
            <div className="flex items-center justify-center mt-4">
              <Badge className="bg-accent/10 text-accent">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Enhanced Shopping Experience
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <div className="lg:w-1/4">
                  <ProductFilters
                    filters={filters}
                    categories={categories || []}
                    onFilterChange={handleFilterChange}
                  />
                </div>
                
                {/* Product Results */}
                <div className="lg:w-3/4">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground" data-testid="text-results-count">
                        Showing {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} results
                      </span>
                      <div className="flex items-center space-x-2 bg-accent/10 px-3 py-1 rounded-full">
                        <Brain className="w-4 h-4 text-accent" />
                        <span className="text-xs font-medium text-accent">AI-Sorted by Relevance</span>
                      </div>
                    </div>
                    <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-48" data-testid="select-sort">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai_match-desc">Best Match (AI)</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="rating-desc">Customer Rating</SelectItem>
                        <SelectItem value="created-desc">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Product Grid */}
                  {loadingProducts ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-48 w-full rounded-lg" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-4">
                        <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2" data-testid="text-no-results">
                          No products found
                        </h3>
                        <p data-testid="text-no-results-description">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleFilterChange({
                          categoryId: '',
                          petType: '',
                          minPrice: undefined,
                          maxPrice: undefined,
                          search: '',
                          inStock: false
                        })}
                        data-testid="button-clear-filters"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center mt-8 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="text-muted-foreground">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            data-testid={`button-page-${totalPages}`}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      <ChatAssistant />
    </div>
  );
}
