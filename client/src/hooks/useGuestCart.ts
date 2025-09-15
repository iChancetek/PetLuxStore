import { useState, useEffect } from "react";
import { CartItem, Product } from "@shared/schema";

// Guest cart item structure (matches database structure but with temporary IDs)
export interface GuestCartItem {
  id: string; // temporary UUID for guest items
  userId: null; // null for guest items
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product?: Product; // populated when needed
}

export interface GuestCartWithProducts extends Omit<GuestCartItem, 'product'> {
  product: Product;
}

const GUEST_CART_KEY = "guestCart";

// Helper to generate temporary UUIDs for guest cart items
function generateTempId(): string {
  return 'guest-' + crypto.randomUUID();
}

// Helper to get current timestamp
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GuestCartItem[];
        setItems(parsed);
      }
    } catch (error) {
      console.error('Error loading guest cart from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, []);

  // Save cart to localStorage whenever items change
  const saveToStorage = (cartItems: GuestCartItem[]) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
      setItems(cartItems);
    } catch (error) {
      console.error('Error saving guest cart to localStorage:', error);
      throw new Error('Failed to save cart data');
    }
  };

  // Add item to guest cart
  const addItem = async (productId: string, quantity: number = 1): Promise<GuestCartItem> => {
    setIsLoading(true);
    try {
      const now = getCurrentTimestamp();
      
      // Check if item already exists
      const existingItemIndex = items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          updatedAt: now
        };
        saveToStorage(updatedItems);
        setItems(updatedItems);  // Update React state
        return updatedItems[existingItemIndex];
      } else {
        // Create new item
        const newItem: GuestCartItem = {
          id: generateTempId(),
          userId: null,
          productId,
          quantity,
          createdAt: now,
          updatedAt: now
        };
        const updatedItems = [...items, newItem];
        saveToStorage(updatedItems);
        setItems(updatedItems);  // Update React state
        return newItem;
      }
    } catch (error) {
      console.error('Error adding item to guest cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (id: string, quantity: number): Promise<GuestCartItem> => {
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        throw new Error('Cart item not found');
      }

      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity,
        updatedAt: getCurrentTimestamp()
      };
      
      saveToStorage(updatedItems);
      setItems(updatedItems);  // Update React state
      return updatedItems[itemIndex];
    } catch (error) {
      console.error('Error updating guest cart item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      const updatedItems = items.filter(item => item.id !== id);
      saveToStorage(updatedItems);
      setItems(updatedItems);  // Update React state
    } catch (error) {
      console.error('Error removing item from guest cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item by product ID (useful for product-based removal)
  const removeByProductId = async (productId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const updatedItems = items.filter(item => item.productId !== productId);
      saveToStorage(updatedItems);
      setItems(updatedItems);  // Update React state
    } catch (error) {
      console.error('Error removing item by product ID from guest cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all items from cart
  const clearCart = async (): Promise<void> => {
    setIsLoading(true);
    try {
      localStorage.removeItem(GUEST_CART_KEY);
      setItems([]);
    } catch (error) {
      console.error('Error clearing guest cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all cart items
  const getItems = (): GuestCartItem[] => {
    return [...items];
  };

  // Get item count
  const getItemCount = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Get subtotal (requires product data to be loaded separately)
  const getSubtotal = (itemsWithProducts: GuestCartWithProducts[]): number => {
    return itemsWithProducts.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  // Check if a product is in cart
  const hasProduct = (productId: string): boolean => {
    return items.some(item => item.productId === productId);
  };

  // Get quantity for a specific product
  const getProductQuantity = (productId: string): number => {
    const item = items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  // Export cart data for merge operations
  const exportCartData = (): GuestCartItem[] => {
    return getItems();
  };

  return {
    items,
    isLoading,
    addItem,
    updateQuantity,
    removeItem,
    removeByProductId,
    clearCart,
    getItems,
    getItemCount,
    getSubtotal,
    hasProduct,
    getProductQuantity,
    exportCartData,
  };
}