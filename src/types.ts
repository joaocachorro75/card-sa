import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface Neighborhood {
  id: number;
  name: string;
  delivery_fee: number;
}

export interface CartItem extends Product {
  quantity: number;
}

// ============================================
// SISTEMA DE PEDIDOS E PAGAMENTOS
// ============================================

export type OrderStatus = 
  | 'pendente' 
  | 'confirmado' 
  | 'em_preparo' 
  | 'saiu_para_entrega' 
  | 'entregue' 
  | 'cancelado'
  | 'aguardando_pagamento';

export type PaymentStatus = 
  | 'pendente' 
  | 'aguardando_pagamento' 
  | 'pagamento_em_analise' 
  | 'pago' 
  | 'pagamento_rejeitado'
  | 'pending_delivery';

export interface OrderHistoryItem {
  id: number;
  order_id: number;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface Order {
  id: number;
  establishment_id: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_reference: string | null;
  neighborhood_id: number | null;
  neighborhood_name?: string;
  total: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: PaymentStatus;
  pix_code: string | null;
  pix_qrcode: string | null;
  pix_expires_at: string | null;
  status: OrderStatus;
  notes: string | null;
  type: string;
  items_text: string;
  created_at: string;
  updated_at: string;
  history?: OrderHistoryItem[];
}

export interface CustomerData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  address_number: string;
  address_complement?: string;
  address_reference?: string;
  neighborhood_id: number | null;
}

export interface DashboardMetrics {
  totalSold: number;
  todayOrders: number;
  todayTotal: number;
  avgTicket: number;
  statusCounts: Array<{ status: string; count: number }>;
  monthOrders: number;
  monthTotal: number;
}
