import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useSignIn } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Sparkles, Brain, ShoppingBag, Heart } from "lucide-react";
import type { Category } from "@shared/schema";

export default function Landing() {
  const { toast } = useToast();
  const { signIn } = useSignIn();

  // Fetch categories from API
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleLogin = () => {
    toast({
      title: "Opening sign in", 
      description: "Please sign in to continue...",
    });
    if (signIn) {
      signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/shop",
        redirectUrlComplete: "/shop"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-serif font-bold text-primary">The PotLuxE</h1>
              <div className="hidden md:flex space-x-6">
                <a href="#shop" className="text-muted-foreground hover:text-foreground transition-colors">Shop</a>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogin} data-testid="button-login">
                Sign In
              </Button>
              <Button onClick={handleLogin} data-testid="button-get-started">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge className="bg-accent text-accent-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Shopping
                </Badge>
              </div>
              <h1 className="text-5xl font-serif font-bold mb-6 leading-tight" data-testid="text-hero-title">
                Premium Products for Your Beloved Pets
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed" data-testid="text-hero-description">
                Discover curated, high-quality pet products with personalized AI recommendations tailored specifically for your furry, feathered, or scaled family members.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleLogin}
                  data-testid="button-start-shopping"
                >
                  Start Shopping
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={handleLogin}
                  data-testid="button-ai-recommendations"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Get AI Recommendations
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Happy golden retriever with premium pet products" 
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
                    <p className="text-sm text-muted-foreground" data-testid="text-ai-badge-subtitle">Perfect for Max</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="text-features-title">Why Choose The PotLuxE?</h2>
            <p className="text-muted-foreground text-lg" data-testid="text-features-subtitle">Experience the future of pet shopping with AI-powered personalization</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center" data-testid="card-feature-ai">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Recommendations</h3>
                <p className="text-muted-foreground">
                  Get personalized product suggestions based on your pet's specific needs, age, and preferences
                </p>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-feature-premium">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
                <p className="text-muted-foreground">
                  Curated selection of high-quality products from trusted brands that prioritize pet health and happiness
                </p>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-feature-assistant">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Shopping Assistant</h3>
                <p className="text-muted-foreground">
                  24/7 AI assistant to help you find products, answer questions, and provide expert pet care advice
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section id="shop" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4" data-testid="text-categories-title">Shop by Category</h2>
            <p className="text-muted-foreground text-lg" data-testid="text-categories-subtitle">Everything your pet needs, curated with care</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(categories && categories.length > 0 ? categories : [
              {
                id: "1",
                name: "Premium Food",
                slug: "premium-food", 
                description: "Nutrition-packed meals for optimal health",
                imageUrl: "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: "2",
                name: "Interactive Toys",
                slug: "interactive-toys",
                description: "Engaging play for mental stimulation", 
                imageUrl: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: "3",
                name: "Comfort & Sleep",
                slug: "comfort-sleep",
                description: "Cozy beds and relaxation essentials",
                imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: "4",
                name: "Health & Grooming",
                slug: "health-grooming",
                description: "Essential care for wellbeing",
                imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ]).map((category, index) => (
              <Card key={category.id || index} className="group cursor-pointer overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-category-${category.slug || index}`}>
                <div className="relative">
                  <img 
                    src={category.imageUrl || `https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`}
                    alt={category.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Browse Collection</span>
                    <Badge variant="secondary">AI Curated</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-4" data-testid="text-cta-title">
            Ready to Give Your Pet the Best?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
            Join thousands of pet parents who trust The PotLuxE for premium products and AI-powered recommendations.
          </p>
          <Button 
            size="lg" 
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleLogin}
            data-testid="button-cta-join"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Start Shopping Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-serif font-bold mb-4">The PotLuxE</h3>
              <p className="text-background/80 mb-4">Premium pet products with AI-powered personalization for your beloved companions.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-background/80">
                <li>AI Recommendations</li>
                <li>Premium Products</li>
                <li>Expert Support</li>
                <li>Fast Shipping</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-background/80">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Shipping Info</li>
                <li>Returns</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-background/80">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Careers</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-background/20 pt-8 text-center text-background/60">
            <p>&copy; 2024 The PotLuxE. All rights reserved. Powered by AI technology.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
