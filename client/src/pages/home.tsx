import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProductCard from "@/components/product/product-card";
import ChatAssistant from "@/components/ai/chat-assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, ShoppingBag, TrendingUp, Star } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Authentication is handled by Clerk - no redirect needed

  // Fetch recommended products
  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ["/api/products", { limit: 8, sortBy: "ai_match", sortOrder: "desc" }],
    enabled: isAuthenticated,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

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
      
      {/* Hero Section */}
      <section className="gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge className="bg-accent text-accent-foreground ai-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Shopping
                </Badge>
              </div>
              <h1 className="text-5xl font-serif font-bold mb-6 leading-tight" data-testid="text-hero-title">
                Welcome Back to Premium Pet Care
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed" data-testid="text-hero-description">
                Discover new arrivals and personalized recommendations curated just for your pets' unique needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  data-testid="button-explore-products"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Explore Products
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-ai-picks"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  View AI Picks
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Happy pets with premium products" 
                className="rounded-2xl shadow-2xl w-full"
                data-testid="img-hero"
              />
              <div className="absolute -bottom-6 -left-6 bg-card text-card-foreground p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold" data-testid="text-ai-badge-title">AI Recommended</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-ai-badge-subtitle">Based on your preferences</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="text-categories-title">Shop by Category</h2>
            <p className="text-muted-foreground text-lg" data-testid="text-categories-subtitle">Find everything your pet needs, powered by AI insights</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories?.map((category: any, index: number) => (
              <Card key={category.id} className="group cursor-pointer overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-category-${index}`}>
                <div className="relative">
                  <img 
                    src={category.imageUrl || `https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`}
                    alt={category.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-muted-foreground mb-4">{category.description || "Premium products for your pet"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available now</span>
                    <Badge variant="secondary">AI Curated</Badge>
                  </div>
                </CardContent>
              </Card>
            )) || (
              // Fallback categories
              [
                {
                  name: "Premium Food",
                  image: "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                  description: "Nutrition-packed meals for optimal health"
                },
                {
                  name: "Interactive Toys",
                  image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                  description: "Engaging play for mental stimulation"
                },
                {
                  name: "Comfort & Sleep",
                  image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                  description: "Cozy beds and relaxation essentials"
                },
                {
                  name: "Health & Grooming",
                  image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                  description: "Essential care for wellbeing"
                }
              ].map((category, index) => (
                <Card key={index} className="group cursor-pointer overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-category-${index}`}>
                  <div className="relative">
                    <img 
                      src={category.image}
                      alt={category.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Available now</span>
                      <Badge variant="secondary">AI Curated</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* AI Recommendations Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="font-medium">AI-Powered Recommendations</span>
            </div>
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="text-recommendations-title">
              Picks Perfect for Your Pet
            </h2>
            <p className="text-muted-foreground text-lg" data-testid="text-recommendations-subtitle">
              Based on your preferences and browsing history
            </p>
          </div>
          
          {loadingRecommendations ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                  <div className="bg-muted h-48 rounded-lg mb-4"></div>
                  <div className="bg-muted h-4 rounded mb-2"></div>
                  <div className="bg-muted h-4 rounded w-3/4 mb-4"></div>
                  <div className="bg-muted h-8 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations?.products?.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              )) || (
                // Fallback products
                [
                  {
                    id: "1",
                    name: "Organic Grain-Free Dog Food",
                    price: "89.99",
                    originalPrice: "99.99",
                    imageUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                    aiMatch: 98,
                    rating: "5.0",
                    reviewCount: 247,
                    aiDescription: "Perfect for dogs with sensitive stomachs and active lifestyles"
                  },
                  {
                    id: "2",
                    name: "Interactive Puzzle Feeder",
                    price: "34.99",
                    imageUrl: "https://images.unsplash.com/photo-1571566882372-1598d88abd90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                    aiMatch: 95,
                    rating: "4.5",
                    reviewCount: 156,
                    aiDescription: "Stimulates hunting instincts while slowing down eating"
                  },
                  {
                    id: "3",
                    name: "Orthopedic Memory Foam Bed",
                    price: "129.99",
                    originalPrice: "149.99",
                    imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                    aiMatch: 92,
                    rating: "5.0",
                    reviewCount: 89,
                    aiDescription: "Perfect for senior pets or those with joint issues"
                  },
                  {
                    id: "4",
                    name: "Professional Grooming Kit",
                    price: "79.99",
                    imageUrl: "https://images.unsplash.com/photo-1560743173-567a3b5658b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                    aiMatch: 88,
                    rating: "4.0",
                    reviewCount: 203,
                    aiDescription: "Complete kit for at-home grooming sessions"
                  }
                ].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary" data-testid="text-stat-customers">50,000+</div>
              <div className="text-muted-foreground">Happy Pet Parents</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary" data-testid="text-stat-products">10,000+</div>
              <div className="text-muted-foreground">Premium Products</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary" data-testid="text-stat-accuracy">95%</div>
              <div className="text-muted-foreground">AI Recommendation Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ChatAssistant />

    </div>
  );
}
