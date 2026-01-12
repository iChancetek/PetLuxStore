import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product } from "@shared/schema";

export interface GuestCartItem {
  id: string;
  userId: null;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface GuestCartWithProducts extends Omit<GuestCartItem, 'product'> {
  product: Product;
}

interface GuestCartContextType {
  items: GuestCartItem[];
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<GuestCartItem>;
  updateQuantity: (id: string, quantity: number) => Promise<GuestCartItem>;
  removeItem: (id: string) => Promise<void>;
  removeByProductId: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItems: () => GuestCartItem[];
  getItemCount: () => number;
  getSubtotal: (itemsWithProducts: GuestCartWithProducts[]) => number;
  hasProduct: (productId: string) => boolean;
  getProductQuantity: (productId: string) => number;
  exportCartData: () => GuestCartItem[];
}

const GUEST_CART_KEY = "guestCart";

function generateTempId(): string {
  return 'guest-' + crypto.randomUUID();
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

const GuestCartContext = createContext<GuestCartContextType | null>(null);

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GuestCartItem[];
        setItems(parsed);
      }
    } catch (error) {
      console.error('Error loading guest cart from localStorage:', error);
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, []);

  const saveToStorage = useCallback((cartItems: GuestCartItem[]) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
      setItems(cartItems);
    } catch (error) {
      console.error('Error saving guest cart to localStorage:', error);
      throw new Error('Failed to save cart data');
    }
  }, []);

  const addItem = useCallback(async (productId: string, quantity: number = 1): Promise<GuestCartItem> => {
    setIsLoading(true);
    try {
      const now = getCurrentTimestamp();
      
      const currentItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]') as GuestCartItem[];
      const existingItemIndex = currentItems.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          updatedAt: now
        };
        saveToStorage(updatedItems);
        return updatedItems[existingItemIndex];
      } else {
        const newItem: GuestCartItem = {
          id: generateTempId(),
          userId: null,
          productId,
          quantity,
          createdAt: now,
          updatedAt: now
        };
        const updatedItems = [...currentItems, newItem];
        saveToStorage(updatedItems);
        return newItem;
      }
    } catch (error) {
      console.error('Error adding item to guest cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const updateQuantity = useCallback(async (id: string, quantity: number): Promise<GuestCartItem> => {
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const currentItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]') as GuestCartItem[];
      const itemIndex = currentItems.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        throw new Error('Cart item not found');
      }

      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity,
        updatedAt: getCurrentTimestamp()
      };
      
      saveToStorage(updatedItems);
      return updatedItems[itemIndex];
    } catch (error) {
      console.error('Error updating guest cart item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const removeItem = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      const currentItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]') as GuestCartItem[];
      const updatedItems = currentItems.filter(item => item.id !== id);
      saveToStorage(updatedItems);
    } catch (error) {
      console.error('Error removing item from guest cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const removeByProductId = useCallback(async (productId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const currentItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]') as GuestCartItem[];
      const updatedItems = currentItems.filter(item => item.productId !== productId);
      saveToStorage(updatedItems);
    } catch (error) {
      console.error('Error removing item by product ID from guest cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const clearCart = useCallback(async (): Promise<void> => {
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
  }, []);

  const getItems = useCallback((): GuestCartItem[] => {
    return [...items];
  }, [items]);

  const getItemCount = useCallback((): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback((itemsWithProducts: GuestCartWithProducts[]): number => {
    return itemsWithProducts.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  }, []);

  const hasProduct = useCallback((productId: string): boolean => {
    return items.some(item => item.productId === productId);
  }, [items]);

  const getProductQuantity = useCallback((productId: string): number => {
    const item = items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  }, [items]);

  const exportCartData = useCallback((): GuestCartItem[] => {
    return [...items];
  }, [items]);

  return (
    <GuestCartContext.Provider value={{
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
    }}>
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart(): GuestCartContextType {
  const context = useContext(GuestCartContext);
  if (!context) {
    throw new Error('useGuestCart must be used within a GuestCartProvider');
  }
  return context;
}
