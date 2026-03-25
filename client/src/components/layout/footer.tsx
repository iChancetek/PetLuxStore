import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Mail, Twitter, Instagram, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-[#030308] border-t border-white/8 overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/4 w-96 h-64 bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-64 bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container mx-auto px-4 pt-16 pb-8">
        {/* Main footer grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-serif font-bold gradient-text" data-testid="text-footer-logo">
                The PotLuxE
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs" data-testid="text-footer-description">
              The world's first AI-native luxury pet store. Curated products, intelligent
              recommendations, and premium quality for your beloved companions.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, label: "Twitter", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Facebook, label: "Facebook", href: "#" },
                { icon: Youtube, label: "YouTube", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 glass rounded-lg border border-white/10 hover:border-violet-500/30 flex items-center justify-center text-white/40 hover:text-violet-400 transition-all duration-200 hover:glow-sm"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wider uppercase" data-testid="text-footer-shop-title">
              Shop
            </h4>
            <ul className="space-y-3">
              {[
                { label: "All Products", href: "/shop" },
                { label: "Fish & Aquatic", href: "/shop?petType=fish" },
                { label: "AI Picks", href: "/ai-picks" },
                { label: "New Arrivals", href: "/shop?sort=new" },
                { label: "Best Sellers", href: "/shop?sort=popular" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/40 hover:text-violet-300 transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wider uppercase" data-testid="text-footer-support-title">
              Support
            </h4>
            <ul className="space-y-3">
              {[
                { label: "AI Assistant", href: "#" },
                { label: "Help Center", href: "#" },
                { label: "Contact Us", href: "#" },
                { label: "Shipping Info", href: "#" },
                { label: "Returns", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-white/40 hover:text-violet-300 transition-colors duration-200"
                    data-testid={`link-footer-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wider uppercase" data-testid="text-footer-company-title">
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
                { label: "Careers", href: "#" },
                { label: "Press", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-white/40 hover:text-violet-300 transition-colors duration-200"
                    data-testid={`link-footer-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI-powered badge strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-white/8 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {["AI-Powered", "Luxury Curated", "Premium Quality", "Fast Shipping"].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass border border-white/8 text-xs text-white/35 font-medium"
              >
                <div className="w-1 h-1 bg-violet-400 rounded-full" />
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/25">
            <Mail className="w-3.5 h-3.5" />
            hello@thepotluxe.com
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-xs" data-testid="text-footer-copyright">
            &copy; 2026 The PotLuxE. All rights reserved. Powered by AI technology.
          </p>
          <p className="text-white/15 text-xs">
            Developed by ChanceTEK LLC &amp; iSynera LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
