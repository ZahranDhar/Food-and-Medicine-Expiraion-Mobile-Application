import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

console.log('[API BASE URL]', API_URL);

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  NOTIFICATION_MAP: 'scheduled_notifications',
};
