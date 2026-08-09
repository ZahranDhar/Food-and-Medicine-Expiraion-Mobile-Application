/**
 * mockApi.ts
 *
 * A fully in-memory + AsyncStorage backed mock API that replaces real network
 * calls. Initial seed data comes from mockDb.json. Mutations (add/delete
 * products, signup) are persisted to AsyncStorage so they survive page refreshes.
 *
 * Login credentials for the demo account:
 *   Email:    demo@pantry.app
 *   Password: demo1234
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User } from '../types/auth';
import { Product } from '../types/product';
import seedData from './mockDb.json';

// ─── Storage keys ──────────────────────────────────────────────────────────────
const MOCK_USERS_KEY = '__mock_users__';
const MOCK_PRODUCTS_KEY = '__mock_products__';
// Bump this version string whenever mockDb.json changes to force a re-seed.
const MOCK_SEEDED_KEY = '__mock_seeded_v2__';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function simulateDelay(ms = 400): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

interface StoredUser extends User {
  password: string;
}

/** Seed storage once from mockDb.json on first run */
async function ensureSeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(MOCK_SEEDED_KEY);
  if (seeded) return;

  await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(seedData.users));
  await AsyncStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(seedData.products));
  await AsyncStorage.setItem(MOCK_SEEDED_KEY, '1');
}

async function getUsers(): Promise<StoredUser[]> {
  await ensureSeeded();
  const raw = await AsyncStorage.getItem(MOCK_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

async function getProducts(): Promise<Product[]> {
  await ensureSeeded();
  const raw = await AsyncStorage.getItem(MOCK_PRODUCTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(products));
}

function makeToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const mockAuthApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    await simulateDelay();
    const users = await getUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );
    if (!found) {
      throw new Error('Incorrect email or password');
    }
    const { password: _pw, ...user } = found;
    return { token: makeToken(user._id), user };
  },

  signup: async (
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    await simulateDelay();
    const users = await getUsers();

    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username is already taken');
    }

    const newUser: StoredUser = {
      _id: generateId('usr'),
      username,
      firstName,
      lastName,
      email,
      password,
    };
    await saveUsers([...users, newUser]);

    const { password: _pw, ...user } = newUser;
    return { token: makeToken(user._id), user };
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    await simulateDelay(200);
    // Read the persisted user from auth storage (set by AuthContext)
    const raw = await AsyncStorage.getItem('auth_user');
    if (!raw) throw new Error('Not authenticated');
    const user: User = JSON.parse(raw);
    return { token: makeToken(user._id), user };
  },
};

// ─── Product API ──────────────────────────────────────────────────────────────

export const mockProductApi = {
  fetchProducts: async (): Promise<Product[]> => {
    await simulateDelay(500);
    // Return only the logged-in user's products
    const raw = await AsyncStorage.getItem('auth_user');
    const user: User | null = raw ? JSON.parse(raw) : null;
    const all = await getProducts();
    if (!user) return [];
    return all.filter((p) => p.email === user.email);
  },

  addProduct: async (title: string, imageUri: string, category?: string): Promise<Product> => {
    await simulateDelay(800);
    const raw = await AsyncStorage.getItem('auth_user');
    const user: User | null = raw ? JSON.parse(raw) : null;
    if (!user) throw new Error('Not authenticated');

    // Generate a random expiration date between 2 and 60 days from now
    const daysAhead = Math.floor(Math.random() * 58) + 2;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + daysAhead);
    const expirationDate = expDate.toISOString().split('T')[0];

    // If the imageUri is a local file path (from camera/gallery on native),
    // fall back to a nice placeholder on web where blob URLs don't persist.
    const isRemote = imageUri.startsWith('http');
    const placeholders = [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
      'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80',
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=80',
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80',
    ];
    const image = isRemote
      ? imageUri
      : placeholders[Math.floor(Math.random() * placeholders.length)];

    const newProduct: Product = {
      _id: generateId('prd'),
      title,
      image,
      email: user.email,
      expirationDate,
      createdAt: new Date().toISOString(),
      category: category || 'Other',
    };

    const all = await getProducts();
    await saveProducts([...all, newProduct]);
    return newProduct;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await simulateDelay(300);
    const all = await getProducts();
    await saveProducts(all.filter((p) => p._id !== id));
  },
};
