import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { isAuthenticated, isAdmin, optionalAuth, requireReviewer } from "./auth/authMiddleware";
import authRoutes from "./auth/authRoutes";
import { registerUploadRoutes } from "./uploads";
import { 
  generateProductDescription, 
  generateProductRecommendations, 
  enhanceSearchQuery, 
  generateChatResponse,
  generateMarketingCopy 
} from "./openai";
import { 
  insertProductSchema, 
  insertCartItemSchema, 
  insertOrderSchema, 
  insertReviewSchema, 
  insertAiInteractionSchema,
  insertUserSchema,
  insertAuditLogSchema,
  insertActivityEventSchema
} from "@shared/schema";

// AI RAG Context Types
interface AIProductSummary {
  id: string;
  slug?: string;
  name: string;
  brand?: string;
  category: string;
  petType?: string;
  price: number;
  rating: number;
  inStock?: number;
  shortDescription?: string;
  keyFeatures?: string[];
}

interface AICategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

interface AIUserProfile {
  role?: string;
  petType?: string;
  petAge?: string;
  petSize?: string;
  previousPurchases?: string[];
  browsedProducts?: string[];
}

interface AIContext {
  conversationHistory: Array<{ role: string; content: string }>;
  currentProduct?: AIProductSummary;
  categories: AICategory[];
  productsTopK: AIProductSummary[];
  userProfile?: AIUserProfile;
  navigation: Record<string, string>;
  currentPage: string;
}

// Static website navigation map
const AI_NAVIGATION = {
  "/": "Homepage with featured products and categories",
  "/shop": "Product catalog with filters and search",
  "/ai-picks": "AI-powered personalized product recommendations", 
  "/cart": "Shopping cart and checkout process",
  "/dashboard": "User dashboard with orders and activity",
  "/admin": "Admin dashboard for managing products and users (admin only)",
  "/product/[slug]": "Individual product details page with reviews and recommendations"
};

// Build comprehensive RAG context for AI assistant
async function buildChatContext(req: any, frontendContext: any, userMessage: string): Promise<AIContext> {
  try {
    const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
    
    // Get categories
    const categories = await storage.getCategories();
    const aiCategories: AICategory[] = categories.map(cat => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description || undefined
    }));

    // Get current product if on product page or specified
    let currentProduct: AIProductSummary | undefined;
    const currentProductSlug = frontendContext?.currentProductSlug;
    if (currentProductSlug) {
      const product = await storage.getProductBySlug(currentProductSlug);
      if (product) {
        currentProduct = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand || undefined,
          category: product.brand || 'Premium',
          petType: product.petType || undefined,
          price: Number(product.price),
          rating: Number(product.rating) || 0,
          inStock: product.inStock || 0,
          shortDescription: product.description?.substring(0, 200) || undefined,
          keyFeatures: product.description ? [product.description.substring(0, 100)] : undefined
        };
      }
    }

    // Get relevant products - two-tier approach
    let productsTopK: AIProductSummary[] = [];
    
    // Global snapshot - top rated products
    const { products: globalProducts } = await storage.getProducts({ 
      limit: 30, 
      sortBy: 'rating', 
      sortOrder: 'desc',
      inStock: true 
    });
    
    // Query-relevant products if user message contains product search intent
    if (userMessage && (userMessage.toLowerCase().includes('find') || 
                       userMessage.toLowerCase().includes('recommend') ||
                       userMessage.toLowerCase().includes('suggest') ||
                       userMessage.toLowerCase().includes('best'))) {
      try {
        const enhanced = await enhanceSearchQuery(userMessage);
        const { products: relevantProducts } = await storage.getProducts({
          search: enhanced.suggestedQuery,
          limit: 20,
          sortBy: 'rating',
          sortOrder: 'desc'
        });
        
        // Merge and deduplicate
        const allProducts = [...relevantProducts, ...globalProducts];
        const uniqueProducts = Array.from(
          new Map(allProducts.map(p => [p.id, p])).values()
        ).slice(0, 25);
        
        productsTopK = uniqueProducts.map(p => ({
          id: p.id,
          slug: p.slug || undefined,
          name: p.name,
          brand: p.brand || undefined,
          category: p.brand || 'Premium',
          petType: p.petType || undefined,
          price: Number(p.price),
          rating: Number(p.rating) || 0,
          inStock: p.inStock || 0,
          shortDescription: p.description?.substring(0, 150) || undefined
        }));
      } catch (error) {
        // Fallback to global products on search enhancement failure
        productsTopK = globalProducts.slice(0, 25).map(p => ({
          id: p.id,
          slug: p.slug || undefined,
          name: p.name,
          brand: p.brand || undefined,
          category: p.brand || 'Premium',
          petType: p.petType || undefined,
          price: Number(p.price),
          rating: Number(p.rating) || 0,
          inStock: p.inStock || 0,
          shortDescription: p.description?.substring(0, 150) || undefined
        }));
      }
    } else {
      // Use global products for general queries
      productsTopK = globalProducts.slice(0, 25).map(p => ({
        id: p.id,
        slug: p.slug || undefined,
        name: p.name,
        brand: p.brand || undefined,
        category: p.brand || 'Premium',
        petType: p.petType || undefined,
        price: Number(p.price),
        rating: Number(p.rating) || 0,
        inStock: p.inStock || 0,
        shortDescription: p.description?.substring(0, 150) || undefined
      }));
    }

    // Build user profile
    let userProfile: AIUserProfile | undefined;
    if (userId) {
      try {
        const profile = await storage.getUser(userId);
        const { orders: recentOrders } = await storage.getOrdersByUser(userId, { page: 1, limit: 10 });
        const { events: recentActivity } = await storage.getUserActivity({ userId, page: 1, limit: 20 });
        
        userProfile = {
          role: profile?.role || 'customer',
          previousPurchases: recentOrders.map(order => order.id).slice(0, 5),
          browsedProducts: recentActivity
            .filter(event => event.type === 'product_view' && event.productId)
            .map(event => event.productId!)
            .slice(0, 10)
        };
      } catch (error) {
        console.warn('Error building user profile for AI context:', error);
        // Continue without user profile if there's an error
      }
    }

    return {
      conversationHistory: frontendContext?.history || [],
      currentProduct,
      categories: aiCategories.slice(0, 20),
      productsTopK,
      userProfile,
      navigation: AI_NAVIGATION,
      currentPage: frontendContext?.page || '/'
    };
  } catch (error) {
    console.error('Error building AI context:', error);
    // Return minimal context on error
    return {
      conversationHistory: frontendContext?.history || [],
      categories: [],
      productsTopK: [],
      navigation: AI_NAVIGATION,
      currentPage: frontendContext?.page || '/'
    };
  }
}

// Use live Stripe keys for production site
let stripeSecretKey = '';

if (process.env.STRIPE_LIVE_SECRET_KEY) {
  stripeSecretKey = process.env.STRIPE_LIVE_SECRET_KEY;
  console.log('Using LIVE Stripe key starting with:', stripeSecretKey.substring(0, 20) + '...');
} else if (process.env.STRIPE_SECRET_KEY) {
  stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  // Extract the secret key part from the corrupted environment variable
  if (stripeSecretKey.includes('sk_test_')) {
    // Extract just the secret key part if it's concatenated
    const secretKeyStart = stripeSecretKey.indexOf('sk_test_');
    stripeSecretKey = stripeSecretKey.substring(secretKeyStart);
  }
  console.log('Using TEST Stripe key starting with:', stripeSecretKey.substring(0, 20) + '...');
} else {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY or STRIPE_LIVE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-08-27.basil",
});

// Audit logging helper function
async function logAudit(req: any, action: string, resourceType: string, resourceId?: string, metadata?: any) {
  try {
    const actorId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
    if (!actorId) return; // Skip if no user (shouldn't happen for admin routes)

    await storage.createAuditLog({
      actorId,
      action,
      resourceType,
      resourceId,
      metadata,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging shouldn't break the main operation
  }
}

// Rate limiting helper for activity events
const activityEventCounts = new Map<string, { count: number; resetTime: number }>();
const ACTIVITY_RATE_LIMIT = 100; // events per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkActivityRateLimit(req: any): boolean {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = activityEventCounts.get(ip);

  if (!record || now > record.resetTime) {
    activityEventCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= ACTIVITY_RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Local file upload routes for product images
  registerUploadRoutes(app);
  
  // Custom auth routes (new authentication system)
  app.use('/api/auth', authRoutes);

  // Legacy auth routes (Clerk - to be migrated)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile endpoint for frontend role checking
  app.get('/api/me/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return user profile with role information
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role || 'customer', // Default to customer role
        stripeCustomerId: user.stripeCustomerId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
  });

  // User Dashboard Endpoints
  app.get('/api/me/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const stats = await storage.getUserDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user dashboard stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/me/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      
      // Validate pagination parameters
      if (req.query.page && (isNaN(page) || page < 1)) {
        return res.status(400).json({ message: 'Page must be a positive integer' });
      }
      if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({ message: 'Limit must be between 1 and 100' });
      }
      
      const validPage = page || 1;
      const validLimit = limit || 10;
      
      const result = await storage.getOrdersByUser(userId, { page: validPage, limit: validLimit });
      res.json({
        data: result.orders,
        total: result.total,
        page: validPage,
        limit: validLimit
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/me/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const orderId = req.params.id;
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }

      // Get the order by ID
      const order = await storage.getOrderById(orderId);
      
      // Check if order exists
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Verify the order belongs to the requesting user
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied: Order does not belong to user' });
      }

      // Transform orderItems to match expected format (items)
      const transformedOrder = {
        ...order,
        items: order.orderItems || []
      };

      res.json(transformedOrder);
    } catch (error) {
      console.error('Error fetching user order details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/me/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const type = req.query.type as string;
      
      // Validate pagination parameters
      if (req.query.page && (isNaN(page) || page < 1)) {
        return res.status(400).json({ message: 'Page must be a positive integer' });
      }
      if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({ message: 'Limit must be between 1 and 100' });
      }

      // Validate activity type if provided
      const allowedTypes = ['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'purchase_completed', 'admin_ui'];
      if (type && !allowedTypes.includes(type)) {
        return res.status(400).json({ 
          message: 'Invalid activity type. Allowed types: ' + allowedTypes.join(', ') 
        });
      }
      
      const validPage = page || 1;
      const validLimit = limit || 20;
      
      const filters: any = { userId, page: validPage, limit: validLimit };
      if (type) {
        filters.type = type;
      }
      
      const result = await storage.getUserActivity(filters);
      
      res.json({
        data: result.events,
        total: result.total,
        page: validPage,
        limit: validLimit,
        ...(type && { filter: { type } })
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Products routes
  app.get('/api/products', async (req, res) => {
    try {
      const {
        categoryId,
        petType,
        minPrice,
        maxPrice,
        search,
        inStock,
        page = 1,
        limit = 24,
        sortBy = 'created',
        sortOrder = 'desc'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const filters = {
        categoryId: categoryId as string,
        petType: petType as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        search: search as string,
        inStock: inStock === 'true',
        limit: Number(limit),
        offset,
        sortBy: sortBy as 'price' | 'rating' | 'created' | 'ai_match',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get('/api/products/slug/:slug', async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get('/api/products/:id/recommendations', async (req, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      const products = await storage.getRecommendedProducts(userId, 4);
      res.json(products);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // AI-powered product description generation (admin only)
  app.post('/api/products/:id/generate-description', isAdmin, async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const { keyFeatures, targetPet, regenerate = false } = req.body;

      if (product.aiDescription && !regenerate) {
        return res.json({ message: "AI description already exists. Use regenerate=true to overwrite." });
      }

      const aiDescription = await generateProductDescription(
        product.name,
        product.brand || 'Premium',
        keyFeatures || [],
        targetPet || product.petType || 'pets'
      );

      const updatedProduct = await storage.updateProductAI(
        product.id,
        aiDescription.longDescription,
        95 // Default high AI match score for generated content
      );

      res.json({ 
        product: updatedProduct, 
        aiDescription,
        message: "AI description generated successfully" 
      });
    } catch (error) {
      console.error("Error generating AI description:", error);
      res.status(500).json({ message: "Failed to generate AI description: " + (error as Error).message });
    }
  });

  // Enhanced search with AI suggestions
  app.get('/api/search/enhance', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const suggestion = await enhanceSearchQuery(q as string);
      res.json(suggestion);
    } catch (error) {
      console.error("Error enhancing search:", error);
      res.status(500).json({ message: "Failed to enhance search query" });
    }
  });

  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId
      });

      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch('/api/cart/:id', isAuthenticated, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      console.log('Creating payment intent with amount:', req.body.amount);
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount provided" });
      }
      
      // Get user ID if authenticated, otherwise use 'guest'
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub || 'guest';
      const isGuest = userId === 'guest';
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        payment_method_types: ["card"], // Specify supported payment methods
        metadata: {
          userId: userId,
          isGuest: isGuest.toString(),
          sessionId: req.sessionID || 'unknown', // Track guest sessions
        },
      });
      
      console.log('Payment intent created successfully:', paymentIntent.id, isGuest ? '(guest)' : '(authenticated)');
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Orders routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      const { orderData, orderItems } = req.body;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = await storage.createOrder(
        { ...orderData, userId, orderNumber },
        orderItems
      );

      // Clear cart after successful order
      await storage.clearCart(userId);

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Reviews routes
  app.get('/api/products/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/products/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
        productId: req.params.id
      });

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // AI Chat Assistant routes
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, sessionId, context } = req.body;
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub;

      // Build comprehensive RAG context
      const aiContext = await buildChatContext(req, context, message);

      // Generate AI response with full context
      const chatResponse = await generateChatResponse(message, aiContext);

      // Fallback message if OpenAI returns empty content
      if (!chatResponse.message || chatResponse.message.trim() === '') {
        console.warn('OpenAI returned empty response, using fallback');
        chatResponse.message = "I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question or ask me something else about our pet products?";
      }

      // Save interaction to database
      if (userId) {
        await storage.createAiInteraction({
          userId,
          sessionId: sessionId || `session-${Date.now()}`,
          userMessage: message,
          aiResponse: chatResponse.message,
          context: { suggestedActions: chatResponse.suggestedActions }
        });
      }

      res.json(chatResponse);
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  // AI Recommendations
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const { userProfile, limit = 4 } = req.body;
      
      // Get available products
      const { products } = await storage.getProducts({ limit: 50, sortBy: 'rating', sortOrder: 'desc' });
      
      const recommendations = await generateProductRecommendations(
        userProfile,
        products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.brand || 'Premium',
          description: p.description || '',
          petType: p.petType || '',
          price: Number(p.price),
          rating: Number(p.rating) || 0
        })),
        limit
      );

      // Enrich recommendations with full product data
      const enrichedRecommendations = recommendations.map(rec => {
        const product = products.find(p => p.id === rec.productId);
        if (!product) return null;
        
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          imageUrl: product.imageUrl,
          shortDescription: product.shortDescription,
          rating: product.rating,
          reviewCount: product.reviewCount,
          inStock: product.inStock,
          aiMatch: rec.matchScore,
          reason: rec.reason,
          category: product.brand || 'Premium'
        };
      }).filter(Boolean);

      res.json(enrichedRecommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/orders', isAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders(); // All orders for admin
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/admin/products', isAdmin, async (req: any, res) => {
    try {
      const { search, status, categoryId, stockStatus, page = 1, limit = 20 } = req.query;
      
      const result = await storage.listProductsAdmin({
        search: search as string,
        status: status as string,
        categoryId: categoryId as string,
        stockStatus: stockStatus as string,
        page: Number(page),
        limit: Number(limit)
      });

      await logAudit(req, 'list_products', 'product', undefined, { 
        filters: { search, status, categoryId, stockStatus, page, limit },
        resultCount: result.products.length 
      });

      res.json(result);
    } catch (error) {
      console.error("Error listing products:", error);
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.post('/api/admin/products', isAdmin, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      await logAudit(req, 'create_product', 'product', product.id, { 
        productName: product.name,
        price: product.price,
        categoryId: product.categoryId
      });
      
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/admin/products/:id', isAdmin, async (req: any, res) => {
    try {
      const updates = req.body;
      const productId = req.params.id;
      
      const product = await storage.updateProduct(productId, updates);
      
      const action = updates.isActive === false ? 'archive_product' : 
                     updates.isActive === true ? 'restore_product' : 'update_product';
      
      await logAudit(req, action, 'product', productId, { 
        updates: Object.keys(updates),
        productName: product?.name
      });
      
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/admin/products/:id', isAdmin, async (req: any, res) => {
    try {
      const productId = req.params.id;
      await storage.deleteProduct(productId);
      
      await logAudit(req, 'delete_product', 'product', productId, { 
        action: 'permanent_delete'
      });
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // AI Marketing Copy Generation (admin only)
  app.post('/api/admin/marketing/generate', isAdmin, async (req, res) => {
    try {
      const { productName, type, variants = 3 } = req.body;
      
      const copy = await generateMarketingCopy(productName, type, variants);
      res.json({ variants: copy });
    } catch (error) {
      console.error("Error generating marketing copy:", error);
      res.status(500).json({ message: "Failed to generate marketing copy" });
    }
  });

  // Enhanced Admin User Management Routes
  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const { search, role, page = 1, limit = 20 } = req.query;
      
      const result = await storage.listUsers({
        search: search as string,
        role: role as string,
        page: Number(page),
        limit: Number(limit)
      });

      await logAudit(req, 'list_users', 'user', undefined, { 
        filters: { search, role, page, limit },
        resultCount: result.users.length 
      });

      res.json(result);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  app.post('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);

      await logAudit(req, 'create_user', 'user', user.id, { 
        email: user.email,
        role: user.role 
      });

      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/admin/users/:id', isAdmin, async (req: any, res) => {
    try {
      const userData = req.body;
      const originalUser = await storage.getUser(req.params.id);
      const user = await storage.updateUser(req.params.id, userData);

      await logAudit(req, 'update_user', 'user', user.id, { 
        changes: userData,
        originalRole: originalUser?.role,
        newRole: user.role
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      await storage.deleteUser(req.params.id);

      await logAudit(req, 'delete_user', 'user', req.params.id, { 
        email: user?.email,
        role: user?.role 
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin reset user password
  app.post('/api/admin/users/:id/reset-password', isAdmin, async (req: any, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use authService to hash and update password
      const { authService } = await import('./auth/authService');
      await authService.adminResetUserPassword(req.params.id, password);

      await logAudit(req, 'admin_reset_password', 'user', req.params.id, { 
        targetEmail: user.email 
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Enhanced Order Management Routes
  app.get('/api/admin/orders', isAdmin, async (req: any, res) => {
    try {
      const { status, dateFrom, dateTo, userId, page = 1, limit = 20 } = req.query;
      
      const filters: any = {
        status: status as string,
        userId: userId as string,
        page: Number(page),
        limit: Number(limit)
      };

      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const result = await storage.getOrdersAdmin(filters);

      await logAudit(req, 'list_orders_admin', 'order', undefined, { 
        filters,
        resultCount: result.orders.length 
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/admin/orders/:id', isAdmin, async (req: any, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      await logAudit(req, 'view_order_details', 'order', req.params.id);

      res.json(order);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  // Audit Logs Routes
  app.get('/api/admin/audit-logs', isAdmin, async (req: any, res) => {
    try {
      const { userId, action, resourceType, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
      
      const filters: any = {
        userId: userId as string,
        action: action as string,
        resourceType: resourceType as string,
        page: Number(page),
        limit: Number(limit)
      };

      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const result = await storage.getAuditLogs(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Activity Analytics Routes
  app.get('/api/admin/activity/summary', isAdmin, async (req: any, res) => {
    try {
      const { range = '30d' } = req.query;
      
      const summary = await storage.getActivitySummary({
        range: range as 'today' | '7d' | '30d' | '90d'
      });

      await logAudit(req, 'view_activity_summary', 'analytics', undefined, { range });

      res.json(summary);
    } catch (error) {
      console.error("Error fetching activity summary:", error);
      res.status(500).json({ message: "Failed to fetch activity summary" });
    }
  });

  app.get('/api/admin/activity/top-products', isAdmin, async (req: any, res) => {
    try {
      const { metric = 'views', range = '30d', limit = 10 } = req.query;
      
      const topProducts = await storage.getTopProducts({
        metric: metric as 'views' | 'purchases',
        range: range as 'today' | '7d' | '30d' | '90d',
        limit: Number(limit)
      });

      await logAudit(req, 'view_top_products', 'analytics', undefined, { metric, range, limit });

      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ message: "Failed to fetch top products" });
    }
  });

  app.get('/api/admin/activity/user/:userId', isAdmin, async (req: any, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      
      const result = await storage.getUserActivity({
        userId: req.params.userId,
        page: Number(page),
        limit: Number(limit)
      });

      await logAudit(req, 'view_user_activity', 'user', req.params.userId, { 
        page, 
        limit,
        resultCount: result.events.length 
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // Public Activity Tracking Endpoint (Rate Limited)
  app.post('/api/activity/events', async (req: any, res) => {
    try {
      // Check rate limit
      if (!checkActivityRateLimit(req)) {
        return res.status(429).json({ message: "Rate limit exceeded" });
      }

      const { type, productId, orderId, path, referrer, metadata } = req.body;
      const userId = (req.user as any)?.sub || (req.user as any)?.claims?.sub; // Optional - can track anonymous users too

      const eventData = insertActivityEventSchema.parse({
        userId: userId || null,
        sessionId: req.headers['x-session-id'] as string || `anon-${Date.now()}`,
        type,
        productId,
        orderId,
        path,
        referrer,
        metadata
      });

      const event = await storage.recordActivityEvent(eventData);
      res.json({ success: true, eventId: event.id });
    } catch (error) {
      console.error("Error recording activity event:", error);
      res.status(500).json({ message: "Failed to record activity event" });
    }
  });

  // Add audit logging to existing admin routes
  const originalAdminStatsHandler = app._router.stack.find((layer: any) => 
    layer.route?.path === '/api/admin/stats'
  )?.route?.stack[1]?.handle;

  if (originalAdminStatsHandler) {
    app.get('/api/admin/stats', isAdmin, async (req: any, res) => {
      try {
        const stats = await storage.getDashboardStats();
        await logAudit(req, 'view_dashboard_stats', 'analytics');
        res.json(stats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Failed to fetch admin stats" });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
