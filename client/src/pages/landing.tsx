import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth/auth-modal";
import { Star, Sparkles, Brain, ShoppingBag, Heart, ArrowRight } from "lucide-react";
import type { Category } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Fetch categories from API
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const openSignIn = () => {
    setAuthModalMode("signin");
    setAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthModalMode("signup");
    setAuthModalOpen(true);
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

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-blue-600/20 z-0" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge className="bg-violet-600/10 text-violet-600 border-violet-600/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Shopping
                </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight tracking-tight">
                Premium Products for Your <span className="gradient-text">Beloved Pets</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Discover curated, high-quality pet products with personalized AI recommendations tailored specifically for your furry family members.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 px-8 py-6 rounded-2xl glow-purple hover:scale-105 transition-all duration-300"
                  onClick={openSignUp}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Start Shopping
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-violet-300 dark:border-white/10 px-8 py-6 rounded-2xl backdrop-blur-sm hover:bg-violet-50 dark:hover:bg-white/5 transition-all duration-300"
                  onClick={openSignIn}
                >
                  <Brain className="w-4 h-4 mr-2 text-violet-600" />
                  Get AI Picks
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Happy golden retriever" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              
              {/* AI Badge Overlay */}
              <div className="absolute -bottom-6 -left-6 z-20 bg-white dark:bg-[#0c0c28] border border-violet-200 dark:border-white/10 p-5 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-violet-600 to-blue-600 p-2.5 rounded-xl glow-sm">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">AI Recommended</p>
                    <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Perfect match for Max</p>
                  </div>
                </div>
              </div>

              {/* Decorative Orbs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-violet-500/10 rounded-full blur-[100px] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Why Choose The PotLuxE?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Experience the future of pet shopping with AI-powered personalization and luxury curation.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 hover:border-violet-400/50 transition-all duration-300">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="w-14 h-14 bg-violet-100 dark:bg-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Recommendations</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Personalized product suggestions based on your pet's specific needs, age, and unique preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 hover:border-blue-400/50 transition-all duration-300">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Heart className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Premium Quality</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every product is rigorously vetted by our AI and experts to ensure only the finest for your companions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-white/20 hover:border-violet-400/50 transition-all duration-300">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="w-14 h-14 bg-violet-100 dark:bg-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Assistant</h3>
                <p className="text-muted-foreground leading-relaxed">
                  24/7 intelligent assistance to help you find products, answer questions, and provide care advice.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg">Everything your pet needs, curated with AI intelligence.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories?.map((category) => (
              <Card key={category.id} className="group cursor-pointer overflow-hidden border-white/10 hover:shadow-2xl transition-all duration-500">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={category.imageUrl || `https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&w=400&h=300`}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Explore</span>
                    <Badge variant="outline" className="border-violet-200 text-violet-600">AI Curated</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0c0c28] z-0" />
        <div className="absolute inset-0 animated-bg opacity-30 z-1" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Ready to Give Your Pet the Best?
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join 50,000+ pet parents who trust The PotLuxE for premium products and personalized recommendations.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 px-12 py-8 rounded-2xl text-lg font-bold glow-purple hover:scale-105 transition-all duration-300"
            onClick={openSignUp}
          >
            <ShoppingBag className="w-6 h-6 mr-3" />
            Start Shopping Now
            <ArrowRight className="ml-3 w-5 h-5" />
          </Button>
        </div>
      </section>

      <Footer />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultMode={authModalMode}
      />
    </div>
  );
}
