import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProductCard from "@/components/product/product-card";
import ChatAssistant from "@/components/ai/chat-assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Brain, ShoppingBag, Star, Zap, Shield,
  Award, ArrowRight, Search, Truck, MessageCircle,
  TrendingUp, ChevronRight, Package
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } }
};

export default function Home() {
  const { isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { data: recommendations, isLoading: loadingProducts } = useQuery<{
    products: any[];
    total: number;
  }>({
    queryKey: ["/api/products", { limit: 8, sortBy: "rating", sortOrder: "desc" }],
  });

  const { data: categories } = useQuery({ queryKey: ["/api/categories"] });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-violet-500/30 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">

        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Theme-adaptive overlay over video */}
        <div
          className="absolute inset-0 z-[1]"
          style={{ background: "var(--video-overlay)" }}
        />

        {/* Animated color gradient (very subtle, on top of overlay) */}
        <div className="absolute inset-0 z-[2] animated-bg opacity-10" />

        {/* Soft radial contrast zone so text stays readable over the video */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none dark:hidden"
          style={{ background: "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(240,237,255,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 z-[3] pointer-events-none hidden dark:block"
          style={{ background: "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(4,4,18,0.45) 0%, transparent 70%)" }}
        />

        {/* Floating orbs */}
        <div
          className="absolute top-1/4 left-[8%] w-80 h-80 rounded-full blur-[120px] animate-float-orb pointer-events-none z-[3]"
          style={{ background: "var(--orb-1)" }}
        />
        <div
          className="absolute bottom-1/4 right-[8%] w-96 h-96 rounded-full blur-[130px] animate-float-orb-2 pointer-events-none z-[3]"
          style={{ background: "var(--orb-2)" }}
        />
        <div
          className="absolute top-[15%] right-[25%] w-48 h-48 rounded-full blur-[80px] animate-float-orb-3 pointer-events-none z-[3]"
          style={{ background: "var(--orb-3)" }}
        />


        {/* Content */}
        <motion.div
          className="relative z-10 container mx-auto px-4 pt-24 pb-20"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border mb-10"
              style={{ borderColor: "rgba(139, 92, 246, 0.35)" }}
            >
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300 tracking-wide">
                AI-Native Pet Commerce — The Future is Now
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold leading-none mb-6 tracking-tight"
            >
              <span className="gradient-text">Premium</span>
              <br />
              <span className="text-gray-900 dark:text-white">Pet Care</span>
              <br />
              <span className="shimmer-text">Reimagined</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 dark:text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              The world's first AI-native luxury pet store. Curated products, personalized
              recommendations, and intelligent shopping — powered by next-gen AI technology.
            </motion.p>

            {/* AI Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              onSubmit={handleSearch}
              className="relative max-w-2xl mx-auto mb-12"
            >
              <div className="relative glass rounded-2xl border border-violet-300/30 dark:border-white/10 overflow-hidden hover:border-violet-500/50 transition-all duration-300 focus-within:border-violet-500/60 shadow-lg dark:shadow-none">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500 dark:text-violet-400" />
                <input
                  type="text"
                  placeholder="Ask AI: 'Best organic food for senior dogs'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent pl-14 pr-36 py-5 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none text-base"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 font-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    AI Search
                  </Button>
                </div>
              </div>
            </motion.form>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/shop">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 px-10 py-7 text-base font-semibold rounded-2xl glow-purple transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Start Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/ai-picks">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-violet-300 dark:border-white/15 text-violet-700 dark:text-white bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:border-violet-500 dark:hover:border-violet-500/50 px-10 py-7 text-base font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Explore AI Picks
                </Button>
              </Link>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto"
            >
              {[
                { label: "Happy Pet Parents", value: "50K+" },
                { label: "Premium Products", value: "10K+" },
                { label: "AI Accuracy", value: "95%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass rounded-2xl p-4 text-center border border-violet-300/25 dark:border-white/8 hover:border-violet-500/40 transition-all duration-300 shadow-sm dark:shadow-none"
                >
                  <div className="text-2xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-[11px] text-gray-500 dark:text-white/40 leading-tight">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        >
          <div className="w-px h-14 bg-gradient-to-b from-transparent via-violet-500/50 to-violet-500" />
          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
        </motion.div>
      </section>

      {/* ── CATEGORIES SECTION ── */}
      <section className="py-28 relative" style={{ background: "var(--page-bg)" }}>
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(139,92,246,0.25), transparent)" }}
        />

        <div className="relative container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-300/30 dark:border-violet-500/25 mb-6 shadow-sm dark:shadow-none">
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span className="text-violet-700 dark:text-violet-300 text-sm font-medium">AI Curated Collections</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              Shop by{" "}
              <span className="gradient-text">Category</span>
            </h2>
            <p className="text-gray-500 dark:text-white/40 text-lg max-w-xl mx-auto">
              Every collection hand-curated and powered by intelligent product discovery
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {categories && Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category: any, index: number) => (
                <motion.div
                  key={category.id}
                  variants={scaleIn}
                  whileHover={{ y: -10, transition: { duration: 0.25 } }}
                  className="group cursor-pointer"
                  onClick={() => setLocation(`/shop?categoryId=${category.id}`)}
                  data-testid={`card-category-${index}`}
                >
                  <div className="glass-card rounded-2xl overflow-hidden border border-gray-200/80 dark:border-white/8 hover:border-violet-400/50 dark:hover:border-violet-500/40 transition-all duration-400 hover:shadow-xl dark:hover:shadow-[0_0_50px_rgba(139,92,246,0.2)]">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-blue-600/0 group-hover:from-violet-600/10 group-hover:to-blue-600/10 transition-all duration-400" />
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-violet-600/85 text-white border-0 text-xs backdrop-blur-sm">
                          AI Curated
                        </Badge>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">{category.name}</h3>
                      <p className="text-gray-500 dark:text-white/40 text-sm line-clamp-2 mb-4">
                        {category.description || "Premium products for your pet"}
                      </p>
                      <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-sm font-medium group-hover:gap-2 transition-all duration-200">
                        Browse collection
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-4 text-center py-20 text-gray-400 dark:text-white/25">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Loading categories...</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── AI RECOMMENDED PRODUCTS ── */}
      <section className="py-28 relative" style={{ background: "var(--page-bg-alt)" }}>
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(139,92,246,0.3), transparent)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(59,130,246,0.2), transparent)" }}
        />

        <div className="relative container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-300/30 dark:border-violet-500/30 mb-6 shadow-sm dark:shadow-none">
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400 animate-pulse" />
              <span className="text-violet-700 dark:text-violet-300 text-sm font-medium">AI-Powered Recommendations</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              Picked{" "}
              <span className="gradient-text">Perfect</span>
              {" "}for Your Pet
            </h2>
            <p className="text-gray-500 dark:text-white/40 text-lg">
              Our AI analyzes millions of data points to surface products your pet will love
            </p>
          </motion.div>

          {loadingProducts ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 animate-pulse">
                  <div className="h-48 bg-gray-100 dark:bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-3/4" />
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-1/2" />
                    <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations?.products && recommendations.products.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {recommendations.products.slice(0, 8).map((product: any) => (
                <motion.div key={product.id} variants={scaleIn}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20 text-gray-400 dark:text-white/30">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg mb-6">No products available yet</p>
              <Link href="/shop">
                <Button variant="outline">Browse Shop</Button>
              </Link>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <Link href="/shop">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 px-10 py-7 rounded-2xl glow-purple hover:scale-105 hover:-translate-y-1 transition-all duration-300 text-base font-semibold"
              >
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── WHY POTLUXE ── */}
      <section className="py-28 relative" style={{ background: "var(--page-bg)" }}>
        <div className="relative container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-300/30 dark:border-blue-500/25 mb-6 shadow-sm dark:shadow-none">
              <Shield className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Why Choose PotLuxE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              The Future of{" "}
              <span className="gradient-text">Pet Shopping</span>
            </h2>
            <p className="text-gray-500 dark:text-white/40 text-lg max-w-xl mx-auto">
              We combine luxury curation with cutting-edge AI to deliver an unmatched pet shopping experience
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-7"
          >
            {[
              {
                icon: Brain,
                title: "AI-Native Intelligence",
                desc: "GPT-powered recommendations that learn your pet's unique preferences and surface products they'll truly love.",
                color: "violet",
              },
              {
                icon: Shield,
                title: "Curated Premium Quality",
                desc: "Every product is rigorously vetted by our AI and pet care experts to ensure only the finest for your companions.",
                color: "blue",
              },
              {
                icon: MessageCircle,
                title: "24/7 AI Assistant",
                desc: "Get instant expert advice, personalized product recommendations, and pet care guidance anytime you need it.",
                color: "violet",
              },
              {
                icon: Truck,
                title: "Lightning Fast Delivery",
                desc: "Same-day and next-day delivery options to keep your pet's supplies always perfectly stocked.",
                color: "blue",
              },
              {
                icon: Award,
                title: "Luxury Selection",
                desc: "Premium brands and exclusive products you won't find anywhere else, curated for discerning pet owners.",
                color: "violet",
              },
              {
                icon: TrendingUp,
                title: "Trend Intelligence",
                desc: "Always ahead of the curve with trending products and new arrivals powered by real-time AI market insights.",
                color: "blue",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="glass-card rounded-2xl p-8 border border-gray-200/70 dark:border-white/8 hover:border-violet-400/40 dark:hover:border-violet-500/30 transition-all duration-300 group hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                    feature.color === "violet"
                      ? "bg-violet-100 dark:bg-violet-500/10 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/20"
                      : "bg-blue-100 dark:bg-blue-500/10 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20"
                  }`}
                >
                  <feature.icon
                    className={`w-7 h-7 ${
                      feature.color === "violet"
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-white/45 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 relative overflow-hidden" style={{ background: "var(--page-bg-alt)" }}>
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(139,92,246,0.3), transparent)" }}
        />

        <div className="relative container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-300/30 dark:border-violet-500/25 mb-6 shadow-sm dark:shadow-none">
              <Star className="w-4 h-4 text-violet-500 dark:text-violet-400 fill-current" />
              <span className="text-violet-700 dark:text-violet-300 text-sm font-medium">What Pet Parents Say</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              Loved by{" "}
              <span className="gradient-text">50,000+</span>
              {" "}Pet Parents
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                name: "Sarah M.",
                pet: "Dog Owner",
                rating: 5,
                review:
                  "The AI recommendations are absolutely spot-on! It suggested a food for my senior lab that transformed his energy levels. I'm blown away by how personalized it feels.",
                avatar: "SM",
              },
              {
                name: "James K.",
                pet: "Cat Parent",
                rating: 5,
                review:
                  "I've tried many pet stores but PotLuxE is in a different league. The quality is unmatched and the AI chat helped me find exactly what my picky cat loves.",
                avatar: "JK",
              },
              {
                name: "Dr. Priya R.",
                pet: "Veterinarian & Pet Owner",
                rating: 5,
                review:
                  "As a vet, I'm impressed by the quality of products. The AI recommendations align perfectly with what I'd professionally suggest. This is the future of responsible pet care.",
                avatar: "PR",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="glass-card rounded-2xl p-8 border border-gray-200/70 dark:border-white/8 hover:border-violet-400/30 dark:hover:border-violet-500/25 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none"
              >
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-violet-500 text-violet-500" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-7 italic text-base">
                  "{testimonial.review}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{testimonial.name}</div>
                    <div className="text-gray-400 dark:text-white/35 text-xs mt-0.5">{testimonial.pet}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── NEWSLETTER CTA ── */}
      <section className="py-28 relative overflow-hidden" style={{ background: "var(--page-bg)" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 dark:from-violet-900/20 via-transparent to-blue-50 dark:to-blue-900/20 pointer-events-none" />

        <div className="relative container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-300/30 dark:border-violet-500/30 mb-8 shadow-sm dark:shadow-none">
              <Zap className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span className="text-violet-700 dark:text-violet-300 text-sm font-medium">Stay Ahead with AI Insights</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              Join the{" "}
              <span className="gradient-text">Future</span>
              {" "}of Pet Care
            </h2>
            <p className="text-gray-500 dark:text-white/45 text-lg mb-10 leading-relaxed">
              Get AI-curated product drops, exclusive offers, and expert pet care insights delivered to your inbox.
            </p>
            <form className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email..."
                className="flex-1 glass rounded-xl border border-gray-200 dark:border-white/10 px-5 py-4 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500/50 bg-transparent text-sm shadow-sm dark:shadow-none"
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 px-6 py-4 rounded-xl glow-purple hover:scale-105 transition-all duration-300 whitespace-nowrap font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </form>
            <p className="text-gray-400 dark:text-white/25 text-xs mt-4">
              No spam. Unsubscribe anytime. Powered by AI.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
      <ChatAssistant />
    </div>
  );
}
