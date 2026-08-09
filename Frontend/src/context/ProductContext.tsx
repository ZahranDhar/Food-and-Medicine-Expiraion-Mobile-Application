import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import productApi from '../api/productApi';
import { Product, ProductStatistics } from '../types/product';
import { syncProductNotifications, cancelProductNotification } from '../notifications/notificationService';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  statistics: ProductStatistics;
  fetchProducts: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  addProduct: (title: string, imageUri: string, category?: string) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  clearError: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productApi.fetchProducts();
      setProducts(data);
      // Sync local notification schedule
      await syncProductNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await productApi.fetchProducts();
      setProducts(data);
      await syncProductNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh products');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const addProduct = useCallback(async (title: string, imageUri: string, category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newProduct = await productApi.addProduct(title, imageUri, category);
      setProducts((prev) => {
        const updated = [...prev, newProduct];
        syncProductNotifications(updated).catch(err => console.log('Error syncing notifications:', err));
        return updated;
      });
      return newProduct;
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await productApi.deleteProduct(id);
      
      // Cancel the scheduled warning for this product
      await cancelProductNotification(id);

      setProducts((prev) => {
        const updated = prev.filter((p) => p._id !== id);
        syncProductNotifications(updated).catch(err => console.log('Error syncing notifications:', err));
        return updated;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const statistics = useMemo(() => {
    const now = new Date();
    // Local midnight — used as the baseline for "today"
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let total = products.length;
    let active = 0;
    let expiring = 0;
    let expired = 0;

    products.forEach((product) => {
      const raw = new Date(product.expirationDate);
      // Normalize expiry to local midnight so comparison is timezone-safe
      const expLocal = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
      const diffDays = Math.round(
        (expLocal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) {
        expired++;
      } else if (diffDays <= 7) {
        expiring++;
      } else {
        active++;
      }
    });

    return { total, active, expiring, expired };
  }, [products]);

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        isRefreshing,
        error,
        statistics,
        fetchProducts,
        refreshProducts,
        addProduct,
        deleteProduct,
        clearError,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
