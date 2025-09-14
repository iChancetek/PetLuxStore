import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import ProductCard from "@/components/product/product-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  Heart, 
  Star, 
  TrendingUp, 
  Zap,
  RefreshCw
} from "lucide-react";

interface AIRecommendation {
  id: string;
  name: string;
  price: string;
  rating: number;
  imageUrl: string;
  slug: string;
  aiMatch: number;
  reason: string;
  category: string;
}

export default function AIPicks() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch AI recommendations
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ["/api/ai/recommendations"],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/ai/recommendations", {
        userProfile: {
          userId: user?.id || 'anonymous',
          preferences: ["high-quality", "popular", "well-rated"],
          petTypes: ["dogs", "cats"]
        },
        limit: 8
      });
      return response.json();
    },
    enabled: true,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground" data-testid="heading-ai-picks">
              AI Picks
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Discover personalized product recommendations powered by artificial intelligence, 
            curated just for you and your pets.
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <Badge variant="secondary" className="flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending Now
            </Badge>
            <Badge variant="secondary" className="flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Top Rated
            </Badge>
            <Badge variant="secondary" className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              Pet Favorites
            </Badge>
          </div>

          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            data-testid="button-refresh-picks"
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Get New Picks'}
          </Button>
        </div>

        {/* AI Recommendations Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-primary" />
              Personalized for You
            </CardTitle>
            <CardDescription>
              These products are specially selected based on AI analysis of popular choices, 
              high ratings, and what other pet owners love.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendations.map((product: any) => (
                  <div key={product.id} className="relative">
                    <ProductCard product={product} />
                    <div className="absolute top-2 right-2">
                      <Badge 
                        className="bg-primary text-primary-foreground flex items-center"
                        data-testid={`badge-ai-match-${product.id}`}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Pick
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No AI recommendations available
                </h3>
                <p className="text-muted-foreground mb-4">
                  Check back soon for personalized product suggestions!
                </p>
                <Button onClick={handleRefresh} variant="outline" data-testid="button-retry-picks">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-2">Looking for something specific?</h3>
              <p className="text-muted-foreground mb-4">
                Browse our full collection or use our AI-powered search to find exactly what you need.
              </p>
              <Button onClick={() => window.location.href = '/shop'} data-testid="button-browse-all">
                Browse All Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}