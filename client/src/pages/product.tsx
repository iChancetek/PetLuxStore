import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { activityTracker } from "@/lib/activityTracker";
import { useGuestCart } from "@/hooks/useGuestCart";
import { Product as ProductType, Review, InsertReview, InsertCartItem } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProductCard from "@/components/product/product-card";
import ChatAssistant from "@/components/ai/chat-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Heart, ShoppingCart, Plus, Minus, Truck, Shield, RotateCcw, Sparkles } from "lucide-react";

export default function Product() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const guestCart = useGuestCart();
  const [, params] = useRoute("/product/:slug");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  // Authentication is handled by Clerk - show product page appropriately

  // Fetch product details
  const { data: product, isLoading: loadingProduct } = useQuery<ProductType>({
    queryKey: ["/api/products/slug", params?.slug],
    enabled: !!params?.slug,
  });

  // Track product view when product is loaded
  useEffect(() => {
    if (product && !loadingProduct) {
      activityTracker.trackProductView(product.id, {
        productSlug: product.slug,
        productName: product.name,
        categoryId: product.categoryId,
        price: parseFloat(product.price),
        petType: product.petType,
        aiMatch: product.aiMatch
      });
    }
  }, [product, loadingProduct]);

  // Fetch product reviews
  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["/api/products", product?.id, "reviews"],
    enabled: !!product?.id,
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery<ProductType[]>({
    queryKey: ["/api/products", product?.id, "recommendations"],
    enabled: !!product?.id,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const cartData: Pick<InsertCartItem, 'productId' | 'quantity'> = {
        productId: product!.id,
        quantity,
      };
      await apiRequest("POST", "/api/cart", cartData);
    },
    onSuccess: () => {
      // Track add to cart event
      activityTracker.trackAddToCart(product!.id, quantity, {
        productName: product!.name,
        price: parseFloat(product!.price),
        categoryId: product!.categoryId,
        petType: product!.petType
      });

      toast({
        title: "Added to cart",
        description: `${quantity} ${product!.name}${quantity > 1 ? 's' : ''} added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async () => {
      const reviewData: Pick<InsertReview, 'rating' | 'comment'> = {
        rating: reviewRating,
        comment: reviewText,
      };
      await apiRequest("POST", `/api/products/${product!.id}/reviews`, reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setReviewText("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["/api/products", product!.id, "reviews"] });
    },
  });

  const handleAddToCart = async () => {
    if (isAuthenticated) {
      // Authenticated users: use API
      addToCartMutation.mutate();
    } else {
      // Guest users: use guest cart
      try {
        await guestCart.addItem(product!.id, quantity);
        
        // Track add to cart event
        activityTracker.trackAddToCart(product!.id, quantity, {
          productName: product!.name,
          price: parseFloat(product!.price),
          categoryId: product!.categoryId,
          petType: product!.petType
        });

        toast({
          title: "Added to cart",
          description: `${quantity} ${product!.name}${quantity > 1 ? 's' : ''} added to your cart.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add item to cart. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${product!.name} ${isWishlisted ? "removed from" : "added to"} your wishlist.`,
    });
  };

  const handleSubmitReview = () => {
    if (reviewText.trim()) {
      addReviewMutation.mutate();
    } else {
      toast({
        title: "Review required",
        description: "Please write a review before submitting.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-muted-foreground mb-4" data-testid="text-product-not-found">
            Product Not Found
          </h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Button onClick={() => window.location.href = "/shop"} data-testid="button-back-to-shop">
            Back to Shop
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = (product.images || [product.imageUrl]).filter((img): img is string => img !== null);
  const rating = parseFloat(product.rating || "0");
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={images[selectedImage] || "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-2xl"
                data-testid="img-product-main"
              />
              {product.aiMatch && (
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Match: {product.aiMatch}%
                </Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex space-x-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-primary" : "border-border"
                    }`}
                    data-testid={`button-image-${index}`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Rating */}
            <div className="flex items-center space-x-3">
              <div className="flex text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-5 h-5 ${
                      i < fullStars 
                        ? "fill-current" 
                        : i === fullStars && hasHalfStar 
                          ? "fill-current opacity-50" 
                          : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground" data-testid="text-review-count">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-4xl font-serif font-bold" data-testid="text-product-name">
              {product.name}
            </h1>

            {/* AI Description */}
            {product.aiDescription && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">AI Recommendation</span>
                </div>
                <p className="text-sm" data-testid="text-ai-description">
                  {product.aiDescription}
                </p>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-primary" data-testid="text-product-price">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-2xl text-muted-foreground line-through" data-testid="text-original-price">
                  ${product.originalPrice}
                </span>
              )}
              {product.originalPrice && (
                <Badge variant="destructive" data-testid="badge-discount">
                  Save ${(parseFloat(product.originalPrice) - parseFloat(product.price)).toFixed(2)}
                </Badge>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {(product.inStock ?? 0) > 0 ? (
                <Badge className="bg-green-100 text-green-800" data-testid="badge-in-stock">
                  {(product.inStock ?? 0) <= 5 ? `Only ${product.inStock} left in stock` : "In Stock"}
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid="badge-out-of-stock">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center space-x-2 border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 font-medium" data-testid="text-quantity">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 10}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleWishlistToggle}
                variant="outline"
                size="icon"
                data-testid="button-wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "text-red-500 fill-red-500" : ""}`} />
              </Button>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending || (product.inStock ?? 0) <= 0}
                data-testid="button-add-to-cart"
              >
                {addToCartMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                Add to Cart - ${(parseFloat(product.price) * quantity).toFixed(2)}
              </Button>
              
              <Button variant="outline" size="lg" className="w-full" data-testid="button-buy-now">
                Buy Now
              </Button>
            </div>

            {/* Product Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center space-y-2">
                <Truck className="w-8 h-8 mx-auto text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Free Shipping</div>
                  <div className="text-muted-foreground">On orders $50+</div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <RotateCcw className="w-8 h-8 mx-auto text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Easy Returns</div>
                  <div className="text-muted-foreground">30-day policy</div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <Shield className="w-8 h-8 mx-auto text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Quality Guaranteed</div>
                  <div className="text-muted-foreground">Premium products</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-16">
          <CardContent className="p-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description" data-testid="tab-description">Description</TabsTrigger>
                <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews ({product.reviewCount || 0})</TabsTrigger>
                <TabsTrigger value="care" data-testid="tab-care">Pet Care Tips</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  <p data-testid="text-product-description">
                    {product.description || "Premium quality pet product designed with your pet's comfort and health in mind. Made from the finest materials and backed by our satisfaction guarantee."}
                  </p>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Product Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" data-testid={`badge-tag-${index}`}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  {/* Write Review */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-4">Write a Review</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating</label>
                          <Select value={reviewRating.toString()} onValueChange={(value) => setReviewRating(Number(value))}>
                            <SelectTrigger className="w-32" data-testid="select-rating">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 4, 3, 2, 1].map(rating => (
                                <SelectItem key={rating} value={rating.toString()}>
                                  {rating} Star{rating !== 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Review</label>
                          <Textarea
                            placeholder="Share your experience with this product..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            data-testid="textarea-review"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleSubmitReview}
                          disabled={addReviewMutation.isPending}
                          data-testid="button-submit-review"
                        >
                          {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviews && reviews.length > 0 ? (
                      reviews.map((review: any) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                                  {review.user.firstName?.[0] || 'U'}
                                </div>
                                <div>
                                  <div className="font-medium">{review.user.firstName || 'Anonymous'}</div>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex text-accent">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i}
                                          className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-muted-foreground"}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {review.title && (
                              <h5 className="font-medium mb-2">{review.title}</h5>
                            )}
                            <p className="text-muted-foreground">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground" data-testid="text-no-reviews">
                        No reviews yet. Be the first to review this product!
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="care" className="mt-6">
                <div className="prose max-w-none">
                  <h4 className="font-semibold mb-4">Pet Care Tips</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>For the best results with this product, consider your pet's individual needs and preferences.</p>
                    <p>Always supervise your pet when introducing new products and consult with your veterinarian if you have any concerns about your pet's health or wellbeing.</p>
                    <p>Regular use as directed will help ensure your pet gets the maximum benefit from this premium product.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recommended Products */}
        {recommendations && recommendations.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold mb-4" data-testid="text-recommendations-title">
                You Might Also Like
              </h2>
              <div className="flex items-center justify-center">
                <Badge className="bg-accent/10 text-accent">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Recommendations
                </Badge>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.slice(0, 4).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
      <ChatAssistant />
    </div>
  );
}
