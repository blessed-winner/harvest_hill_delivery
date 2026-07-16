/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type View = 'dashboard' | 'submit' | 'supplies' | 'negotiations' | 'invoices' | 'settings';

export interface Product {
  id: string;
  name: string;
  batch?: string;
  category: string;
  image?: string; // Legacy field, prefer image_url
  image_url?: string; // Cloudinary URL from backend
  quantityNeeded?: string;
  quantityAvailable?: string;
  price: string;
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'DELIVERED' | 'NEGOTIATED' | 'STEADY' | 'HIGH';
  date: string;
}

export interface KPI {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  status?: string;
  icon: string;
  color: string;
}

export interface Negotiation {
  id: string;
  product: Product;
  lastMessage: string;
  price: string;
  status: 'AWAITING' | 'REVIEWING' | 'COMPLETED';
}

export interface Invoice {
  id: string;
  supply: string;
  date: string;
  amount: string;
  status: 'PAID' | 'PENDING';
}

export interface Message {
  sender: 'BUYER' | 'SELLER';
  initials: string;
  text: string;
  price?: string;
  change?: string;
  time: string;
}
