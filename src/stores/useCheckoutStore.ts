/**
 * Checkout Store (Zustand)
 *
 * Manages checkout session state:
 * - Session ID
 * - Products
 * - Customer info
 * - Payment method
 *
 * Does NOT persist (ephemeral checkout state).
 */

import { create } from 'zustand';

interface CheckoutProduct {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
}

interface CustomerInfo {
  email: string;
  name: string;
  phone?: string;
}

interface CheckoutState {
  sessionId: string | null;
  products: CheckoutProduct[];
  customerInfo: CustomerInfo | null;
  paymentMethod: 'free' | 'stripe' | 'invoice';

  // Actions
  setSessionId: (id: string) => void;
  setProducts: (products: CheckoutProduct[]) => void;
  setCustomerInfo: (info: CustomerInfo) => void;
  setPaymentMethod: (method: CheckoutState['paymentMethod']) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  sessionId: null,
  products: [],
  customerInfo: null,
  paymentMethod: 'free',

  setSessionId: (id) => set({ sessionId: id }),
  setProducts: (products) => set({ products }),
  setCustomerInfo: (info) => set({ customerInfo: info }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  reset: () =>
    set({
      sessionId: null,
      products: [],
      customerInfo: null,
      paymentMethod: 'free',
    }),
}));
