import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import axiosInstance from './axios';
import { API_URL, STORAGE_KEYS } from '../constants';
import { Product } from '../types/product';

/**
 * Derive a MIME type from a file URI.
 */
function mimeTypeFromUri(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

export const productApi = {
  fetchProducts: async (): Promise<Product[]> => {
    const response = await axiosInstance.get<{
      success: boolean;
      count: number;
      products: Product[];
    }>('/products');
    return response.data.products;
  },

  /**
   * Add a product using two separate images:
   *  - labelImageUri: photograph of expiration label (sent for OCR extraction only, NOT stored)
   *  - productImageUri: photograph of physical product (uploaded to Cloudinary by backend)
   *
   * Uses expo-file-system `File` + `expo/fetch` to stream native file bytes directly to the
   * Express multipart endpoint, avoiding React Native's broken Blob/ArrayBuffer polyfills.
   */
  addProduct: async (
    title: string,
    labelImageUri: string,
    productImageUri: string,
    category?: string
  ): Promise<Product> => {
    // Build expo-file-system File objects directly from the local URIs.
    // File implements Blob with a `bytes()` method that expo/fetch understands.
    const labelFile = new File(labelImageUri);
    const productFile = new File(productImageUri);

    const formData = new FormData();
    formData.append('title', title);
    if (category) {
      formData.append('category', category);
    }
    // Append as File objects — expo/fetch's convertFormData calls bytes() on them
    formData.append('labelImage', labelFile as any);
    formData.append('productImage', productFile as any);

    console.log('[PRODUCT UPLOAD] FormData prepared');
    console.log('[PRODUCT UPLOAD] labelImageUri:', labelImageUri);
    console.log('[PRODUCT UPLOAD] productImageUri:', productImageUri);
    console.log('[PRODUCT UPLOAD] fetch starting');

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      // Use expo/fetch (not global fetch) — it handles expo-file-system File in FormData
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('[PRODUCT UPLOAD] fetch resolved');
      console.log('status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        const errorObj: any = new Error(data?.message || `Upload failed (HTTP ${response.status})`);
        errorObj.status = response.status;
        errorObj.responseData = data;
        throw errorObj;
      }

      return data.product;
    } catch (error: any) {
      console.log('[PRODUCT UPLOAD] fetch FAILED');
      console.log('message:', error?.message);
      console.log('name:', error?.name);
      throw error;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`);
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await axiosInstance.get<{
      success: boolean;
      product: Product;
    }>(`/products/${id}`);
    return response.data.product;
  },

  updateProduct: async (
    id: string,
    updates: {
      title?: string;
      category?: string;
      expirationDate?: string;
      labelImageUri?: string;
      productImageUri?: string;
    }
  ): Promise<Product> => {
    let payload: any;

    if (updates.labelImageUri || updates.productImageUri) {
      const formData = new FormData();
      if (updates.title) formData.append('title', updates.title);
      if (updates.category) formData.append('category', updates.category);
      if (updates.expirationDate) formData.append('expirationDate', updates.expirationDate);

      if (updates.labelImageUri) {
        const labelFile = new File(updates.labelImageUri);
        formData.append('labelImage', labelFile as any);
      }

      if (updates.productImageUri) {
        const productFile = new File(updates.productImageUri);
        formData.append('productImage', productFile as any);
      }

      payload = formData;
    } else {
      payload = {
        title: updates.title,
        category: updates.category,
        expirationDate: updates.expirationDate,
      };
    }

    const response = await axiosInstance.put<{
      success: boolean;
      product: Product;
    }>(`/products/${id}`, payload);

    return response.data.product;
  },
};

export default productApi;
