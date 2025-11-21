/**
 * Checkout Hook
 *
 * Handles checkout flow using Backend API:
 * - Create checkout session
 * - Confirm payment
 * - Get checkout config
 */

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured');
}

export interface CreateSessionData {
  organizationId: string;
  productId: string;
  quantity?: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: 'free' | 'stripe' | 'invoice';
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentData {
  sessionId: string;
  checkoutSessionId: string;
  paymentIntentId: string; // 'free', 'invoice', or Stripe payment intent ID
}

export interface CheckoutSession {
  sessionId: string;
  organizationId: string;
  productId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: number;
  stripeSessionUrl?: string;
}

export interface CheckoutResult {
  success: boolean;
  ticketId?: string;
  ticketNumber?: string;
  qrCode?: string;
  transactionId?: string;
  invoiceId?: string;
  error?: string;
  message?: string;
}

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = async (data: CreateSessionData): Promise<CheckoutSession | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      console.error('Create session error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (data: ConfirmPaymentData): Promise<CheckoutResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/checkout/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment confirmation failed');
      }

      const result = await response.json();
      return {
        success: true,
        ticketId: result.data?.ticketId,
        ticketNumber: result.data?.ticketNumber,
        qrCode: result.data?.qrCode,
        transactionId: result.data?.transactionId,
        invoiceId: result.data?.invoiceId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      console.error('Confirm payment error:', err);
      return {
        success: false,
        error: 'PAYMENT_FAILED',
        message,
      };
    } finally {
      setLoading(false);
    }
  };

  const getCheckoutConfig = async (organizationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/checkout/config?organizationId=${organizationId}`);

      if (!response.ok) {
        throw new Error('Failed to get checkout config');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      console.error('Get config error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createSession,
    confirmPayment,
    getCheckoutConfig,
  };
}
