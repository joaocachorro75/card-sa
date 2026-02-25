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
