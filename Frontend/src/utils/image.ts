import { Platform } from 'react-native';
import { API_URL } from '../constants';

/**
 * Normalizes a product image URL.
 * If the URL points to localhost/127.0.0.1, it replaces it with the base of the current API_URL
 * to ensure that images load correctly on Android emulators and physical devices.
 */
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // If the image is a local upload path from development fallback
  if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
    const apiBase = API_URL.replace(/\/api\/?$/, ''); // e.g. http://10.0.2.2:3000
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):3000/, apiBase);
  }
  
  return url;
}
