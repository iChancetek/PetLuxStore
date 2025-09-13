import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    price: string;
    originalPrice?: string;
    imageUrl?: string;
    aiMatch?: number;
    rating?: string;
    reviewCount?: number;
    aiDescription?: string;
    inStock?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} ${isWishlisted ? "removed from" : "added to"} your wishlist.`,
    });
  };

  const productUrl = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
  const rating = parseFloat(product.rating || "0");
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <Link href={productUrl}>
      <Card className="product-card cursor-pointer group overflow-hidden hover:shadow-xl transition-all duration-300" data-testid={`card-product-${product.id}`}>
        <div className="relative">
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-product-${product.id}`}
          />
          
          {/* AI Match Badge */}
          {product.aiMatch && (
            <Badge 
              className="absolute top-3 left-3 bg-accent text-accent-foreground"
              data-testid={`badge-ai-match-${product.id}`}
            >
              AI Match: {product.aiMatch}%
            </Badge>
          )}
          
          {/* Sale Badge */}
          {product.originalPrice && (
            <Badge 
              variant="destructive" 
              className="absolute top-3 right-12"
              data-testid={`badge-sale-${product.id}`}
            >
              Sale
            </Badge>
          )}
          
          {/* Wishlist Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 bg-card/80 hover:bg-card"
            onClick={handleWishlistToggle}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart 
              className={`h-4 w-4 ${isWishlisted ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} 
            />
          </Button>
        </div>
        
        <CardContent className="p-6">
          {/* Rating */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex text-accent">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-4 h-4 ${
                    i < fullStars 
                      ? "fill-current" 
                      : i === fullStars && hasHalfStar 
                        ? "fill-current opacity-50" 
                        : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            {product.reviewCount && (
              <span className="text-sm text-muted-foreground" data-testid={`text-review-count-${product.id}`}>
                ({product.reviewCount} reviews)
              </span>
            )}
          </div>
          
          {/* Product Name */}
          <h3 className="text-lg font-semibold mb-2 line-clamp-2" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          
          {/* AI Description */}
          {product.aiDescription && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2" data-testid={`text-ai-description-${product.id}`}>
              {product.aiDescription}
            </p>
          )}
          
          {/* Stock Status */}
          {product.inStock !== undefined && (
            <div className="mb-4">
              {product.inStock > 0 ? (
                <Badge variant="secondary" className="text-green-700 bg-green-100" data-testid={`badge-in-stock-${product.id}`}>
                  {product.inStock <= 5 ? `Only ${product.inStock} left` : "In Stock"}
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid={`badge-out-of-stock-${product.id}`}>
                  Out of Stock
                </Badge>
              )}
            </div>
          )}
          
          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-primary" data-testid={`text-price-${product.id}`}>
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                  ${product.originalPrice}
                </span>
              )}
            </div>
            <Button 
              size="sm"
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || (product.inStock !== undefined && product.inStock <= 0)}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              {addToCartMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
