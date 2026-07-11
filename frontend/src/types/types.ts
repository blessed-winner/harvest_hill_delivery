export type ViewType = 'dashboard' | 'users' | 'products' | 'orders' | 'deliveries' | 'invoices' | 'supplies' | 'reports';

export interface KPIStats {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'FARMER' | 'STAFF' | 'SUPPLIER' | 'CLIENT' | 'ADMIN';
  status: 'active' | 'suspended';
  dateJoined: string;
  lastActive: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  status: 'active' | 'inactive';
  season: string;
  image: string;
  isPriority?: boolean;
}

export interface Order {
  id: string;
  client: string;
  items: number;
  total: number;
  isNegotiated: boolean;
  status: 'SUBMITTED' | 'APPROVED' | 'IN DELIVERY' | 'COMPLETED';
  date: string;
}

export interface Invoice {
  id: string;
  client: string;
  orderId: string;
  amount: number;
  status: 'SYNCED' | 'UNSYNCED' | 'PENDING';
  dueDate: string;
}

export interface DeliveryNote {
  id: string;
  orderId: string;
  client: string;
  items: string;
  date: string;
  status: 'Disputed' | 'Pending' | 'Confirmed';
}

export interface NegotiationMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
}
