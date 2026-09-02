/**
 * notificationService.ts
 *
 * Two-phase notification strategy per product:
 *
 * Phase 1 — Product expires in MORE than 7 days
 *   → One-shot alert at (expiryDate − 7 days) at 9 AM.
 *
 * Phase 2 — Product expires in 7 days or LESS (including already expired)
 *   → Daily repeating notification at 9 AM every day until the product is
 *     deleted by the user.
 *
 * On delete → all notifications for that product are immediately cancelled.
 *
 * NOTE: expo-notifications does not support scheduled notifications on web.
 *       All functions return immediately (no-op) when Platform.OS === 'web'.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import { Product } from '../types/product';
import { Platform } from 'react-native';

// ─── Notification handler ──────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Types ─────────────────────────────────────────────────────────────────────

type NotificationType = 'one-shot' | 'daily';

interface NotificationMapValue {
  notificationId: string;
  type: NotificationType;
  triggerTime?: number; // only for one-shot
}

interface NotificationMap {
  [productId: string]: NotificationMapValue;
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function daysUntilExpiry(expirationDate: string): number {
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildContent(product: Product, days: number) {
  if (days < 0) {
    const d = Math.abs(days);
    return {
      title: `${product.title} has expired! 🗑️`,
      body: `It expired ${d} day${d !== 1 ? 's' : ''} ago. Tap to remove it from your pantry.`,
    };
  }
  if (days === 0) {
    return {
      title: `${product.title} expires TODAY ⚠️`,
      body: 'Use it or remove it from your pantry now.',
    };
  }
  return {
    title: `${product.title} expiring soon 🍊`,
    body: `It will expire in ${days} day${days !== 1 ? 's' : ''}. Take action before it's too late.`,
  };
}

async function loadMap(): Promise<NotificationMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_MAP);
  return raw ? JSON.parse(raw) : {};
}

async function saveMap(map: NotificationMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_MAP, JSON.stringify(map));
}

async function cancelEntry(productId: string, map: NotificationMap): Promise<void> {
  const entry = map[productId];
  if (!entry) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(entry.notificationId);
  } catch {
    // already fired or removed — safe to ignore
  }
  delete map[productId];
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Request OS permission for notifications.
 * No-op on web.
 */
export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  if (!Device.isDevice) {
    console.log('Notice: Running on virtual device/emulator. Remote push notifications require a physical device, but local scheduled alerts are fully active.');
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('freshness-alerts', {
        name: 'Freshness Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Cancel all scheduled notifications for a single product.
 * Called immediately when the user deletes a product.
 * No-op on web.
 */
export const cancelProductNotification = async (productId: string): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    const map = await loadMap();
    await cancelEntry(productId, map);
    await saveMap(map);
  } catch (error) {
    console.error(`Error cancelling notification for ${productId}:`, error);
  }
};

/**
 * Full reconciliation — call after every fetch / add / delete.
 *
 * For each live product:
 *   days > 7  → one-shot alert at (expiry − 7 days) 9 AM
 *   days ≤ 7  → daily repeating at 9 AM (fires every day until product is deleted)
 *
 * Products no longer in the list have their notifications cancelled.
 * No-op on web.
 */
export const syncProductNotifications = async (products: Product[]): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    const map = await loadMap();
    const liveIds = new Set(products.map((p) => p._id));

    // 1. Cancel notifications for products that were removed
    for (const productId of Object.keys(map)) {
      if (!liveIds.has(productId)) {
        await cancelEntry(productId, map);
      }
    }

    // 2. Ensure correct notification type for each live product
    for (const product of products) {
      const days = daysUntilExpiry(product.expirationDate);
      const existing = map[product._id];

      if (days > 7) {
        // ── Phase 1: one-shot when product enters 7-day window ──────────────
        const triggerDate = new Date(product.expirationDate);
        triggerDate.setDate(triggerDate.getDate() - 7);
        triggerDate.setHours(9, 0, 0, 0);
        const triggerTime = triggerDate.getTime();

        if (existing?.type === 'one-shot' && existing.triggerTime === triggerTime) {
          continue; // already correctly scheduled
        }

        if (existing) await cancelEntry(product._id, map);

        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${product.title} expiring in 7 days 🍊`,
              body: 'Tap to view your pantry and plan ahead.',
              data: { productId: product._id },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });
          map[product._id] = { notificationId: id, type: 'one-shot', triggerTime };
        } catch (err) {
          console.error(`Failed to schedule one-shot for ${product._id}:`, err);
        }

      } else {
        // ── Phase 2: daily repeating until deleted ───────────────────────────
        if (existing?.type === 'daily') {
          continue; // already in daily mode
        }

        if (existing) await cancelEntry(product._id, map); // cancel stale one-shot

        const { title, body } = buildContent(product, days);

        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { productId: product._id },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: 9,
              minute: 0,
            },
          });
          map[product._id] = { notificationId: id, type: 'daily' };
        } catch (err) {
          console.error(`Failed to schedule daily for ${product._id}:`, err);
        }
      }
    }

    await saveMap(map);
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
};

// Named export kept for backward compatibility
export const scheduleProductNotification = async (product: Product): Promise<void> => {
  await syncProductNotifications([product]);
};

export const notificationService = {
  requestPermissions,
  scheduleProductNotification,
  cancelProductNotification,
  syncProductNotifications,
};

export default notificationService;
