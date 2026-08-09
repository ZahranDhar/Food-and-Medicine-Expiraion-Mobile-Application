export interface Product {
  _id: string;
  title: string;
  image: string;
  email: string;
  expirationDate: string; // YYYY-MM-DD
  createdAt: string; // ISO datetime
  category?: string;
}

export type ProductStatus = 'active' | 'expiring' | 'expired';

export interface ProductStatistics {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}
