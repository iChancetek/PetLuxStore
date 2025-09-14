import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart, ImageOff } from "lucide-react";
import { Link } from "wouter";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    price: string;
    originalPrice?: string;
    aiMatch?: number;
    rating?: string;
    reviewCount?: number;
    shortDescription?: string;
    tags?: string[];
    brand?: string;
    inStock?: number;
    imageUrl?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
      <Card className="product-card cursor-pointer group hover:shadow-xl transition-all duration-300" data-testid={`card-product-${product.id}`}>
        <CardContent className="p-0">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted" data-testid={`image-container-${product.id}`}>
            {product.imageUrl && !imageError ? (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                    imageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  data-testid={`image-product-${product.id}`}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted text-muted-foreground" data-testid={`image-fallback-${product.id}`}>
                <ImageOff className="w-12 h-12" />
              </div>
            )}
          </div>
          
          <div className="p-6">
            {/* Header with badges and wishlist */}
            <div className="flex items-start justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {/* AI Match Badge */}
              {product.aiMatch && (
                <Badge 
                  className="bg-accent text-accent-foreground"
                  data-testid={`badge-ai-match-${product.id}`}
                >
                  AI Match: {product.aiMatch}%
                </Badge>
              )}
              
              {/* Sale Badge */}
              {product.originalPrice && (
                <Badge 
                  variant="destructive" 
                  data-testid={`badge-sale-${product.id}`}
                >
                  Sale
                </Badge>
              )}
            </div>
            
            {/* Wishlist Button */}
            <Button
              variant="secondary"
              size="icon"
              className="bg-card/80 hover:bg-card shrink-0"
              onClick={handleWishlistToggle}
              data-testid={`button-wishlist-${product.id}`}
            >
              <Heart 
                className={`h-4 w-4 ${isWishlisted ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} 
              />
            </Button>
          </div>
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
          
          {/* Brand */}
          {product.brand && (
            <p className="text-sm text-muted-foreground mb-2" data-testid={`text-brand-${product.id}`}>
              By {product.brand}
            </p>
          )}
          
          {/* Key Bullet Points */}
          <div className="mb-4">
            {product.shortDescription && (
              <p className="text-sm text-muted-foreground mb-2" data-testid={`text-short-description-${product.id}`}>
                {product.shortDescription}
              </p>
            )}
            
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs"
                    data-testid={`badge-tag-${product.id}-${index}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
