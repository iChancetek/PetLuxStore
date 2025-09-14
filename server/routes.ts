import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupClerkAuth, isAuthenticated, isAdmin, optionalAuth } from "./clerkAuth";
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

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Audit logging helper function
async function logAudit(req: any, action: string, resourceType: string, resourceId?: string, metadata?: any) {
  try {
    const actorId = req.user?.claims?.sub;
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
  // Auth middleware
  await setupClerkAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      console.log('Creating payment intent with amount:', req.body.amount);
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount provided" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user?.claims?.sub || '',
        },
      });
      
      console.log('Payment intent created successfully:', paymentIntent.id);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Orders routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;

      // Generate AI response
      const chatResponse = await generateChatResponse(message, {
        conversationHistory: context?.history || [],
        userProfile: context?.userProfile,
        availableProducts: context?.products,
        currentPage: context?.page
      });

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

      res.json(recommendations);
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

  app.post('/api/admin/products', isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/admin/products/:id', isAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const product = await storage.updateProduct(req.params.id, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/admin/products/:id', isAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
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
      const userId = req.user?.claims?.sub; // Optional - can track anonymous users too

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
