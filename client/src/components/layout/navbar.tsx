import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import CartDrawer from "@/components/cart/cart-drawer";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserMenu } from "@/components/auth/user-menu";
import {
  Search,
  ShoppingBag,
  Menu,
  Sparkles,
  LogOut,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navbar() {
  const [location] = useLocation();
  const { user, signout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [scrolled, setScrolled] = useState(false);
  const guestCart = useGuestCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: cartItems } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const authCartCount = Array.isArray(cartItems)
    ? cartItems.reduce((total: number, item: any) => total + item.quantity, 0)
    : 0;
  const guestCartCount = guestCart.items.reduce((total, item) => total + item.quantity, 0);
  const cartItemCount = user ? authCartCount : guestCartCount;
  const isAdmin = user?.role === "admin";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const openSignInModal = () => {
    setAuthModalMode("signin");
    setAuthModalOpen(true);
  };

  const openSignUpModal = () => {
    setAuthModalMode("signup");
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signout();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const navLinks = [
    { href: "/shop", label: "Shop", active: location.startsWith("/shop") },
    { href: "/ai-picks", label: "AI Picks", active: location === "/ai-picks" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard", active: location === "/dashboard" }] : []),
    ...(user && isAdmin ? [{ href: "/admin", label: "Admin", active: location === "/admin" }] : []),
  ];

  const navBg = scrolled
    ? isDark
      ? "bg-[#050510]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
      : "bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm"
    : "bg-transparent border-b border-transparent";

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group" data-testid="link-logo">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center glow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-serif font-bold gradient-text group-hover:opacity-90 transition-opacity">
                  The PotLuxE
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    link.active
                      ? "text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10"
                      : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5"
                  }`}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                  {link.active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-500 rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm relative">
              <div className="relative w-full glass rounded-xl border border-gray-200/80 dark:border-white/10 hover:border-violet-400/40 dark:hover:border-violet-500/30 focus-within:border-violet-400/60 dark:focus-within:border-violet-500/50 transition-all duration-300 overflow-hidden shadow-sm dark:shadow-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                <input
                  type="text"
                  placeholder="Ask AI: 'Best food for senior dogs'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent pl-10 pr-20 py-2.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none"
                  data-testid="input-search"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Badge className="bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-500/30 text-xs px-2 py-0.5">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    AI
                  </Badge>
                </div>
              </div>
            </form>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl glass border border-gray-200/80 dark:border-white/10 hover:border-violet-400/40 dark:hover:border-violet-500/30 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-white/5"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={openSignInModal}
                    className="text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5 text-sm"
                    data-testid="button-login"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={openSignUpModal}
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 px-5 py-2 rounded-xl text-sm font-medium glow-sm transition-all duration-300 hover:scale-105"
                    data-testid="button-signup"
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {/* Cart */}
              <button
                className="relative w-10 h-10 rounded-xl glass border border-gray-200/80 dark:border-white/10 hover:border-violet-400/40 dark:hover:border-violet-500/30 flex items-center justify-center text-gray-500 dark:text-white/70 hover:text-violet-600 dark:hover:text-white transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-white/5"
                onClick={() => setIsCartOpen(true)}
                data-testid="button-cart"
              >
                <ShoppingBag className="h-4 w-4" />
                <AnimatePresence>
                  {cartItemCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      data-testid="badge-cart-count"
                    >
                      {cartItemCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl glass border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5 rounded-xl"
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 bg-white dark:bg-[#08081f] border-l border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                >
                  <div className="flex flex-col space-y-6 mt-6">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="relative">
                      <div className="glass rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none"
                          data-testid="input-mobile-search"
                        />
                      </div>
                    </form>

                    {/* Mobile Nav Links */}
                    <div className="flex flex-col gap-1">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                            link.active
                              ? "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20"
                              : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          data-testid={`link-mobile-${link.label.toLowerCase()}`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    {/* Mobile Cart */}
                    <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                      <button
                        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl glass border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30 text-gray-600 dark:text-white/70 hover:text-violet-600 dark:hover:text-white transition-all duration-200 text-sm font-medium"
                        onClick={() => {
                          setIsCartOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        data-testid="button-mobile-cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Cart
                        {cartItemCount > 0 && (
                          <span className="ml-auto bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {cartItemCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Mobile User Info */}
                    <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                      {user ? (
                        <div>
                          <div className="flex items-center gap-3 mb-5 p-3 glass rounded-xl border border-gray-200 dark:border-white/8">
                            {user.profileImageUrl ? (
                              <img
                                src={user.profileImageUrl}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-400/30"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white text-sm">{user.firstName || "User"}</div>
                              <div className="text-xs text-gray-400 dark:text-white/40 truncate">{user.email}</div>
                            </div>
                          </div>
                          <button
                            className="w-full flex items-center gap-2 py-3 px-4 rounded-xl text-gray-500 dark:text-white/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all duration-200 text-sm font-medium"
                            onClick={handleSignOut}
                            data-testid="button-mobile-logout"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <button
                            className="w-full py-3 px-4 rounded-xl glass border border-gray-200 dark:border-white/15 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/25 transition-all duration-200 text-sm font-medium"
                            onClick={openSignInModal}
                            data-testid="button-mobile-login"
                          >
                            Sign In
                          </button>
                          <button
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-blue-500 transition-all duration-200"
                            onClick={openSignUpModal}
                            data-testid="button-mobile-signup"
                          >
                            Get Started
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-[73px]" />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
}
