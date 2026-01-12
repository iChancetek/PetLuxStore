import {
  users,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  reviews,
  aiInteractions,
  auditLogs,
  activityEvents,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Review,
  type InsertReview,
  type AiInteraction,
  type InsertAiInteraction,
  type AuditLog,
  type InsertAuditLog,
  type ActivityEvent,
  type InsertActivityEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ilike, inArray, sql, isNotNull, lt } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  verifyUserEmail(userId: string): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Product operations
  getProducts(filters?: {
    categoryId?: string;
    petType?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    inStock?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'price' | 'rating' | 'created' | 'ai_match';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ products: Product[]; total: number }>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getRecommendedProducts(userId?: string, limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  updateProductAI(id: string, aiDescription: string, aiMatch?: number): Promise<Product>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  getOrders(userId?: string): Promise<Order[]>;
  getOrderById(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Review operations
  getProductReviews(productId: string): Promise<(Review & { user: User })[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review>;
  deleteReview(id: string): Promise<void>;

  // AI operations
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
  getAiInteractions(userId: string, sessionId?: string): Promise<AiInteraction[]>;

  // Analytics
  getDashboardStats(): Promise<{
    totalRevenue: number;
    ordersToday: number;
    totalProducts: number;
    lowStockProducts: number;
  }>;

  // Admin User Management
  listUsers(filters?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }>;
  createUser(userData: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Admin Product Management
  listProductsAdmin(filters?: {
    search?: string;
    status?: string;
    categoryId?: string;
    stockStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }>;

  // Audit Logging
  createAuditLog(entry: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }>;

  // Activity Tracking
  recordActivityEvent(event: InsertActivityEvent): Promise<ActivityEvent>;
  getActivitySummary(filters?: {
    range?: 'today' | '7d' | '30d' | '90d';
  }): Promise<{
    pageViews: number;
    productViews: number;
    cartAdditions: number;
    purchases: number;
    chartData: Array<{ date: string; pageViews: number; productViews: number; purchases: number }>;
  }>;
  getTopProducts(filters?: {
    metric?: 'views' | 'purchases';
    range?: 'today' | '7d' | '30d' | '90d';
    limit?: number;
  }): Promise<Array<{ product: Product; count: number }>>;
  getUserActivity(filters?: {
    userId: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: ActivityEvent[]; total: number }>;

  // Enhanced Order Management
  getOrdersAdmin(filters?: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: (Order & { user: User; itemCount: number })[]; total: number }>;

  // User Dashboard Methods
  getOrdersByUser(userId: string, filters?: {
    page?: number;
    limit?: number;
  }): Promise<{ orders: (Order & { orderItems: (OrderItem & { product: Product })[] })[], total: number }>;

  getUserDashboardStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    lastPurchaseAt: Date | null;
    recentProducts: Product[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async verifyUserEmail(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(filters?: {
    categoryId?: string;
    petType?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    inStock?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'price' | 'rating' | 'created' | 'ai_match';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ products: Product[]; total: number }> {
    const conditions = [eq(products.isActive, true)];

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.petType) {
      conditions.push(eq(products.petType, filters.petType));
    }

    if (filters?.minPrice) {
      conditions.push(sql`${products.price} >= ${filters.minPrice}`);
    }

    if (filters?.maxPrice) {
      conditions.push(sql`${products.price} <= ${filters.maxPrice}`);
    }

    if (filters?.search) {
      conditions.push(
        sql`(${ilike(products.name, `%${filters.search}%`)} OR ${ilike(products.description, `%${filters.search}%`)})`
      );
    }

    if (filters?.inStock) {
      conditions.push(sql`${products.inStock} > 0`);
    }

    // Build the where condition
    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Build sort column
    const sortColumn = filters?.sortBy === 'created' ? products.createdAt :
                      filters?.sortBy === 'rating' ? products.rating :
                      filters?.sortBy === 'ai_match' ? products.aiMatch : products.price;
    
    const sortDirection = filters?.sortOrder === 'desc' ? desc : asc;
    const orderBy = filters?.sortBy ? sortDirection(sortColumn) : desc(products.createdAt);

    // Build the complete query
    const baseQuery = db.select().from(products).where(whereCondition).orderBy(orderBy);
    
    // Build the products query with limit and offset if provided
    const productsQuery = filters?.limit || filters?.offset
      ? baseQuery.limit(filters?.limit || 1000).offset(filters?.offset || 0)
      : baseQuery;

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(products).where(whereCondition);

    const [productsResult, totalResult] = await Promise.all([
      productsQuery,
      countQuery
    ]);

    return {
      products: productsResult,
      total: totalResult[0]?.count || 0
    };
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return db.select().from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
      .orderBy(desc(products.rating));
  }

  async getRecommendedProducts(userId?: string, limit = 4): Promise<Product[]> {
    // For now, return products with highest AI match scores
    return db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.aiMatch), desc(products.rating))
      .limit(limit);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  async restoreDeletedProduct(id: string): Promise<Product> {
    const [restored] = await db.update(products)
      .set({ deletedAt: null, isActive: true, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return restored;
  }

  async permanentlyDeleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getDeletedProducts(): Promise<Product[]> {
    return db.select().from(products).where(isNotNull(products.deletedAt));
  }

  async cleanupExpiredProducts(): Promise<number> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const result = await db.delete(products)
      .where(and(
        isNotNull(products.deletedAt),
        lt(products.deletedAt, sixtyDaysAgo)
      ));
    return result.rowCount || 0;
  }

  async updateProductAI(id: string, aiDescription: string, aiMatch?: number): Promise<Product> {
    const updateData: any = { aiDescription, updatedAt: new Date() };
    if (aiMatch !== undefined) {
      updateData.aiMatch = aiMatch;
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return db.select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      product: products,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(desc(cartItems.createdAt));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db.select().from(cartItems)
      .where(and(
        eq(cartItems.userId, cartItem.userId!),
        eq(cartItems.productId, cartItem.productId!)
      ));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + (cartItem.quantity || 1),
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async getOrders(userId?: string): Promise<Order[]> {
    if (userId) {
      return db.select().from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));
    }
    
    return db.select().from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;

    const orderItemsResult = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      createdAt: orderItems.createdAt,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

    return {
      ...order,
      orderItems: orderItemsResult,
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map(item => ({ ...item, orderId: newOrder.id }))
      );
    }
    
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Review operations
  async getProductReviews(productId: string): Promise<(Review & { user: User })[]> {
    return db.select({
      id: reviews.id,
      userId: reviews.userId,
      productId: reviews.productId,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      isVerified: reviews.isVerified,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      user: users,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update product rating
    const avgResult = await db.select({
      avgRating: sql<number>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`
    })
    .from(reviews)
    .where(eq(reviews.productId, review.productId!));

    if (avgResult[0]) {
      await db.update(products)
        .set({
          rating: avgResult[0].avgRating.toString(),
          reviewCount: avgResult[0].count,
          updatedAt: new Date(),
        })
        .where(eq(products.id, review.productId!));
    }
    
    return newReview;
  }

  async updateReview(id: string, review: Partial<InsertReview>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // AI operations
  async createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction> {
    const [newInteraction] = await db.insert(aiInteractions).values(interaction).returning();
    return newInteraction;
  }

  async getAiInteractions(userId: string, sessionId?: string): Promise<AiInteraction[]> {
    if (sessionId) {
      return db.select().from(aiInteractions)
        .where(and(
          eq(aiInteractions.userId, userId),
          eq(aiInteractions.sessionId, sessionId)
        ))
        .orderBy(asc(aiInteractions.createdAt));
    }
    
    return db.select().from(aiInteractions)
      .where(eq(aiInteractions.userId, userId))
      .orderBy(asc(aiInteractions.createdAt));
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    ordersToday: number;
    totalProducts: number;
    lowStockProducts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [revenueResult] = await db.select({
      total: sql<number>`COALESCE(SUM(${orders.total}), 0)`
    }).from(orders);

    const [ordersTodayResult] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(orders).where(sql`${orders.createdAt} >= ${today}`);

    const [productsResult] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(products).where(eq(products.isActive, true));

    const [lowStockResult] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(products).where(and(
      eq(products.isActive, true),
      sql`${products.inStock} <= 10`
    ));

    return {
      totalRevenue: revenueResult?.total || 0,
      ordersToday: ordersTodayResult?.count || 0,
      totalProducts: productsResult?.count || 0,
      lowStockProducts: lowStockResult?.count || 0,
    };
  }

  // Admin User Management
  async listUsers(filters?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const conditions = [];
    const limit = filters?.limit || 20;
    const offset = ((filters?.page || 1) - 1) * limit;

    if (filters?.search) {
      conditions.push(
        sql`(${ilike(users.email, `%${filters.search}%`)} OR ${ilike(users.firstName, `%${filters.search}%`)} OR ${ilike(users.lastName, `%${filters.search}%`)})`
      );
    }

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [usersResult, totalResult] = await Promise.all([
      db.select().from(users)
        .where(whereCondition)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(users).where(whereCondition)
    ]);

    return {
      users: usersResult,
      total: totalResult[0]?.count || 0
    };
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async restoreDeletedUser(id: string): Promise<User> {
    const [restored] = await db.update(users)
      .set({ deletedAt: null, isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return restored;
  }

  async permanentlyDeleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getDeletedUsers(): Promise<User[]> {
    return db.select().from(users).where(isNotNull(users.deletedAt));
  }

  async cleanupExpiredUsers(): Promise<number> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const result = await db.delete(users)
      .where(and(
        isNotNull(users.deletedAt),
        lt(users.deletedAt, sixtyDaysAgo)
      ));
    return result.rowCount || 0;
  }

  // Admin Product Management
  async listProductsAdmin(filters?: {
    search?: string;
    status?: string;
    categoryId?: string;
    stockStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const conditions = [];
    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    if (filters?.search) {
      conditions.push(
        sql`(${ilike(products.name, `%${filters.search}%`)} OR ${ilike(products.slug, `%${filters.search}%`)} OR ${ilike(products.brand, `%${filters.search}%`)})`
      );
    }

    if (filters?.status === 'active') {
      conditions.push(eq(products.isActive, true));
    } else if (filters?.status === 'archived') {
      conditions.push(eq(products.isActive, false));
    }

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.stockStatus === 'in-stock') {
      conditions.push(sql`${products.inStock} > 10`);
    } else if (filters?.stockStatus === 'low-stock') {
      conditions.push(sql`${products.inStock} > 0 AND ${products.inStock} <= 10`);
    } else if (filters?.stockStatus === 'out-of-stock') {
      conditions.push(eq(products.inStock, 0));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [productsResult, totalResult] = await Promise.all([
      db.select().from(products)
        .where(whereCondition)
        .orderBy(desc(products.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(products).where(whereCondition)
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      products: productsResult,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Audit Logging
  async createAuditLog(entry: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(entry).returning();
    return log;
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const conditions = [];
    const limit = filters?.limit || 50;
    const offset = ((filters?.page || 1) - 1) * limit;

    if (filters?.userId) {
      conditions.push(eq(auditLogs.actorId, filters.userId));
    }

    if (filters?.action) {
      conditions.push(ilike(auditLogs.action, `%${filters.action}%`));
    }

    if (filters?.resourceType) {
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    }

    if (filters?.dateFrom) {
      conditions.push(sql`${auditLogs.createdAt} >= ${filters.dateFrom}`);
    }

    if (filters?.dateTo) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.dateTo}`);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [logsResult, totalResult] = await Promise.all([
      db.select().from(auditLogs)
        .where(whereCondition)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(whereCondition)
    ]);

    return {
      logs: logsResult,
      total: totalResult[0]?.count || 0
    };
  }

  // Activity Tracking
  async recordActivityEvent(event: InsertActivityEvent): Promise<ActivityEvent> {
    const [activityEvent] = await db.insert(activityEvents).values(event).returning();
    return activityEvent;
  }

  async getActivitySummary(filters?: {
    range?: 'today' | '7d' | '30d' | '90d';
  }): Promise<{
    pageViews: number;
    productViews: number;
    cartAdditions: number;
    purchases: number;
    chartData: Array<{ date: string; pageViews: number; productViews: number; purchases: number }>;
  }> {
    const range = filters?.range || '30d';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const [summaryResult] = await db.select({
      pageViews: sql<number>`COUNT(CASE WHEN ${activityEvents.type} = 'page_view' THEN 1 END)`,
      productViews: sql<number>`COUNT(CASE WHEN ${activityEvents.type} = 'product_view' THEN 1 END)`,
      cartAdditions: sql<number>`COUNT(CASE WHEN ${activityEvents.type} = 'add_to_cart' THEN 1 END)`,
      purchases: sql<number>`COUNT(CASE WHEN ${activityEvents.type} = 'purchase_completed' THEN 1 END)`,
    })
    .from(activityEvents)
    .where(sql`${activityEvents.createdAt} >= ${startDate} AND ${activityEvents.createdAt} <= ${endDate}`);

    // Get chart data grouped by date
    const chartData = await db.select({
      date: sql<string>`DATE(${activityEvents.createdAt})`,
      pageViews: sql<number>`COUNT(CASE WHEN ${activityEvents.type} = 'page_view' THEN 1 END)`,
      productViews: sql<number>`COUNT(CASE WHEN ${activityEvents.type} = 'product_view' THEN 1 END)`,
      purchases: sql<number>`COUNT(CASE WHEN ${activityEvents.type} = 'purchase_completed' THEN 1 END)`,
    })
    .from(activityEvents)
    .where(sql`${activityEvents.createdAt} >= ${startDate} AND ${activityEvents.createdAt} <= ${endDate}`)
    .groupBy(sql`DATE(${activityEvents.createdAt})`)
    .orderBy(sql`DATE(${activityEvents.createdAt})`);

    return {
      pageViews: summaryResult?.pageViews || 0,
      productViews: summaryResult?.productViews || 0,
      cartAdditions: summaryResult?.cartAdditions || 0,
      purchases: summaryResult?.purchases || 0,
      chartData: chartData || []
    };
  }

  async getTopProducts(filters?: {
    metric?: 'views' | 'purchases';
    range?: 'today' | '7d' | '30d' | '90d';
    limit?: number;
  }): Promise<Array<{ product: Product; count: number }>> {
    const metric = filters?.metric || 'views';
    const range = filters?.range || '30d';
    const limit = filters?.limit || 10;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const eventType = metric === 'views' ? 'product_view' : 'purchase_completed';

    const result = await db.select({
      product: products,
      count: sql<number>`COUNT(*)`
    })
    .from(activityEvents)
    .innerJoin(products, eq(activityEvents.productId, products.id))
    .where(and(
      eq(activityEvents.type, eventType),
      sql`${activityEvents.createdAt} >= ${startDate} AND ${activityEvents.createdAt} <= ${endDate}`,
      eq(products.isActive, true)
    ))
    .groupBy(products.id)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

    return result;
  }

  async getUserActivity(filters?: {
    userId: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: ActivityEvent[]; total: number }> {
    if (!filters?.userId) {
      throw new Error('userId is required for getUserActivity');
    }

    const limit = filters?.limit || 50;
    const offset = ((filters?.page || 1) - 1) * limit;

    // Build where conditions
    const conditions = [eq(activityEvents.userId, filters.userId)];
    if (filters.type) {
      conditions.push(eq(activityEvents.type, filters.type));
    }
    const whereCondition = and(...conditions);

    const [eventsResult, totalResult] = await Promise.all([
      db.select().from(activityEvents)
        .where(whereCondition)
        .orderBy(desc(activityEvents.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(activityEvents)
        .where(whereCondition)
    ]);

    return {
      events: eventsResult,
      total: totalResult[0]?.count || 0
    };
  }

  // Enhanced Order Management
  async getOrdersAdmin(filters?: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: (Order & { user: User; itemCount: number })[]; total: number }> {
    const conditions = [];
    const limit = filters?.limit || 20;
    const offset = ((filters?.page || 1) - 1) * limit;

    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }

    if (filters?.userId) {
      conditions.push(eq(orders.userId, filters.userId));
    }

    if (filters?.dateFrom) {
      conditions.push(sql`${orders.createdAt} >= ${filters.dateFrom}`);
    }

    if (filters?.dateTo) {
      conditions.push(sql`${orders.createdAt} <= ${filters.dateTo}`);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [ordersResult, totalResult] = await Promise.all([
      db.select({
        id: orders.id,
        userId: orders.userId,
        orderNumber: orders.orderNumber,
        status: orders.status,
        subtotal: orders.subtotal,
        tax: orders.tax,
        shipping: orders.shipping,
        total: orders.total,
        stripePaymentIntentId: orders.stripePaymentIntentId,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: users,
        itemCount: sql<number>`COUNT(${orderItems.id})`
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(whereCondition)
      .groupBy(orders.id, users.id)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(whereCondition)
    ]);

    return {
      orders: ordersResult,
      total: totalResult[0]?.count || 0
    };
  }

  // User Dashboard Methods
  async getOrdersByUser(userId: string, filters?: {
    page?: number;
    limit?: number;
  }): Promise<{ orders: (Order & { orderItems: (OrderItem & { product: Product })[] })[], total: number }> {
    const limit = filters?.limit || 10;
    const offset = ((filters?.page || 1) - 1) * limit;

    const [ordersResult, totalResult] = await Promise.all([
      db.select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.userId, userId))
    ]);

    // Get order items with products for each order
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const items = await db.select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          product: products,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));
        
        return {
          ...order,
          orderItems: items
        };
      })
    );

    return {
      orders: ordersWithItems,
      total: totalResult[0]?.count || 0
    };
  }

  async getUserDashboardStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    lastPurchaseAt: Date | null;
    recentProducts: Product[];
  }> {
    // Get total orders count
    const [totalOrdersResult] = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.userId, userId));

    // Get total spent
    const [totalSpentResult] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${orders.total}), 0)` 
    })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'delivered')));

    // Get last purchase date
    const [lastPurchaseResult] = await db.select({ createdAt: orders.createdAt })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    // Get recent products from user's orders
    const recentProductsResult = await db.selectDistinct({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      shortDescription: products.shortDescription,
      aiDescription: products.aiDescription,
      price: products.price,
      originalPrice: products.originalPrice,
      categoryId: products.categoryId,
      brand: products.brand,
      imageUrl: products.imageUrl,
      images: products.images,
      inStock: products.inStock,
      isActive: products.isActive,
      rating: products.rating,
      reviewCount: products.reviewCount,
      petType: products.petType,
      tags: products.tags,
      aiMatch: products.aiMatch,
      deletedAt: products.deletedAt,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(orderItems, eq(products.id, orderItems.productId))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(5);

    return {
      totalOrders: totalOrdersResult?.count || 0,
      totalSpent: Number(totalSpentResult?.total || 0),
      lastPurchaseAt: lastPurchaseResult?.createdAt || null,
      recentProducts: recentProductsResult
    };
  }
}

export const storage = new DatabaseStorage();
