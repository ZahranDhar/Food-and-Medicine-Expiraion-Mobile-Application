/**
 * productApi.ts — wired to mockApi for frontend testing.
 * Swap the import below back to the real axios-based implementation
 * once your backend is ready.
 */
import { mockProductApi } from './mockApi';
import { Product } from '../types/product';

export const productApi = {
  fetchProducts: async (): Promise<Product[]> =>
    mockProductApi.fetchProducts(),

  addProduct: async (title: string, imageUri: string, category?: string): Promise<Product> =>
    mockProductApi.addProduct(title, imageUri, category),

  deleteProduct: async (id: string): Promise<void> =>
    mockProductApi.deleteProduct(id),
};

export default productApi;
