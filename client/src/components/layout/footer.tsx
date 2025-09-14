import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-serif font-bold mb-4" data-testid="text-footer-logo">The PotLuxE</h3>
            <p className="text-background/80 mb-4" data-testid="text-footer-description">
              Premium pet products with AI-powered personalization for your beloved companions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-background/60 hover:text-background transition-colors" data-testid="link-social-facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors" data-testid="link-social-twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors" data-testid="link-social-instagram">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" data-testid="text-footer-shop-title">Shop</h4>
            <ul className="space-y-2 text-background/80">
              <li>
                <Link href="/shop?petType=fish">
                  <a className="hover:text-background transition-colors" data-testid="link-footer-fish">Fish</a>
                </Link>
              </li>
              <li>
                <Link href="/shop">
                  <a className="hover:text-background transition-colors" data-testid="link-footer-all-products">All Products</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" data-testid="text-footer-support-title">Support</h4>
            <ul className="space-y-2 text-background/80">
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-contact">Contact Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-help">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-shipping">Shipping Info</a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-returns">Returns</a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-ai-assistant">AI Assistant</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" data-testid="text-footer-company-title">Company</h4>
            <ul className="space-y-2 text-background/80">
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-about">About Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-terms">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors" data-testid="link-footer-careers">Careers</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/20 pt-8 text-center text-background/60">
          <p data-testid="text-footer-copyright">
            &copy; 2024 The PotLuxE. All rights reserved. Powered by AI technology.
          </p>
        </div>
      </div>
    </footer>
  );
}
