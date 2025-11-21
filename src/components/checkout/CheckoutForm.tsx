'use client';

/**
 * Checkout Form Component
 *
 * Handles the complete checkout flow:
 * 1. Collect customer information
 * 2. Select payment method
 * 3. Create checkout session
 * 4. Process payment
 */

import { useState } from 'react';
import { useCheckout } from '@/hooks/useCheckout';
import { useCheckoutStore } from '@/stores/useCheckoutStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Mail, User, Phone, Loader2, CreditCard, FileText, CheckCircle } from 'lucide-react';

interface CheckoutFormProps {
  productId: string;
  organizationId: string;
  onSuccess?: (ticketId: string) => void;
  onError?: (error: string) => void;
}

export function CheckoutForm({
  productId,
  organizationId,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  const { createSession, confirmPayment, loading, error } = useCheckout();
  const { setSessionId, setCustomerInfo, setPaymentMethod, paymentMethod } = useCheckoutStore();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
  });
  const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  const [localPaymentMethod, setLocalPaymentMethod] = useState<'free' | 'stripe' | 'invoice'>('free');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      onError?.('Please fill in all required fields');
      return;
    }

    // Save customer info to store
    setCustomerInfo(formData);

    // Move to payment selection
    setStep('payment');
  };

  const handlePaymentSubmit = async () => {
    setStep('processing');
    setPaymentMethod(localPaymentMethod);

    // Create checkout session
    const session = await createSession({
      organizationId,
      productId,
      quantity: 1,
      customerEmail: formData.email,
      customerName: formData.name,
      customerPhone: formData.phone || undefined,
      paymentMethod: localPaymentMethod,
    });

    if (!session) {
      onError?.(error || 'Failed to create checkout session');
      setStep('payment');
      return;
    }

    setSessionId(session.sessionId);

    // Handle different payment methods
    if (localPaymentMethod === 'stripe' && session.stripeSessionUrl) {
      // Redirect to Stripe
      window.location.href = session.stripeSessionUrl;
      return;
    }

    // For free/invoice, confirm immediately
    const result = await confirmPayment({
      sessionId: session.sessionId,
      checkoutSessionId: session.sessionId,
      paymentIntentId: localPaymentMethod, // 'free' or 'invoice'
    });

    if (result.success && result.ticketId) {
      setStep('success');
      onSuccess?.(result.ticketId);
    } else {
      onError?.(result.message || 'Payment confirmation failed');
      setStep('payment');
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
        <h2 className="text-2xl font-bold">Registration Complete!</h2>
        <p className="text-muted-foreground">
          Your ticket has been sent to {formData.email}
        </p>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="text-center space-y-4 py-8">
        <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Processing...</h2>
        <p className="text-muted-foreground">Please wait while we process your registration</p>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
          <RadioGroup
            value={localPaymentMethod}
            onValueChange={(value) => setLocalPaymentMethod(value as typeof localPaymentMethod)}
            className="space-y-3"
          >
            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <input
                type="radio"
                value="free"
                checked={localPaymentMethod === 'free'}
                onChange={(e) => setLocalPaymentMethod(e.target.value as typeof localPaymentMethod)}
                className="w-4 h-4"
              />
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Free Registration</div>
                <div className="text-sm text-muted-foreground">No payment required</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <input
                type="radio"
                value="stripe"
                checked={localPaymentMethod === 'stripe'}
                onChange={(e) => setLocalPaymentMethod(e.target.value as typeof localPaymentMethod)}
                className="w-4 h-4"
              />
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Credit Card</div>
                <div className="text-sm text-muted-foreground">Pay securely with Stripe</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <input
                type="radio"
                value="invoice"
                checked={localPaymentMethod === 'invoice'}
                onChange={(e) => setLocalPaymentMethod(e.target.value as typeof localPaymentMethod)}
                className="w-4 h-4"
              />
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium">Invoice</div>
                <div className="text-sm text-muted-foreground">Receive invoice by email</div>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('info')}
            className="flex-1"
            disabled={loading}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handlePaymentSubmit}
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleInfoSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="pl-10"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="pl-10"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="+49 123 456789"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        Continue to Payment
      </Button>
    </form>
  );
}
