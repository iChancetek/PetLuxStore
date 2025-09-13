import {
  users,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  reviews,
  aiInteractions,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ilike, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

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

    // Build queries
    let productsQuery = db.select().from(products).where(whereCondition).orderBy(orderBy);
    
    if (filters?.limit) {
      productsQuery = productsQuery.limit(filters.limit);
    }
    if (filters?.offset) {
      productsQuery = productsQuery.offset(filters.offset);
    }

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
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id));
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
    let query = db.select().from(orders);
    
    if (userId) {
      query = query.where(eq(orders.userId, userId));
    }
    
    return query.orderBy(desc(orders.createdAt));
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
    let query = db.select().from(aiInteractions).where(eq(aiInteractions.userId, userId));
    
    if (sessionId) {
      query = query.where(and(
        eq(aiInteractions.userId, userId),
        eq(aiInteractions.sessionId, sessionId)
      ));
    }
    
    return query.orderBy(asc(aiInteractions.createdAt));
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
}

export const storage = new DatabaseStorage();
